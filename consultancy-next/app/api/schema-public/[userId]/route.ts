import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

// Public endpoint — returns JSON-LD structured data from user's Fact-Vault.
// Designed to be called by the Schema Deploy snippet on the customer's website.
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  try {
    let brand = 'Unknown Brand';
    let domain = '';
    let facts: string[] = [];
    let anchors: { label: string }[] = [];

    if (dbAdmin) {
      const [userDoc, factsSnap] = await Promise.all([
        dbAdmin.collection('users').doc(userId).get(),
        dbAdmin.collection('facts').where('userId', '==', userId).limit(20).get(),
      ]);

      if (userDoc.exists) {
        const d = userDoc.data()!;
        brand = d.brand || brand;
        domain = d.domain || domain;
        anchors = d.latentAnchors || [];
      }

      facts = factsSnap.docs
        .map(d => d.data().fact as string)
        .filter(Boolean)
        .slice(0, 15);
    }

    const siteUrl = domain ? `https://${domain.replace(/^https?:\/\//, '')}` : '';

    const jsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${siteUrl}/#org`,
          name: brand,
          url: siteUrl,
          description: anchors.length > 0
            ? anchors.map((a: any) => a.label).join(', ')
            : `${brand} — GEO-optimised brand`,
        },
        ...(facts.length > 0 ? [{
          '@type': 'FAQPage',
          mainEntity: facts.map((fact, i) => ({
            '@type': 'Question',
            name: `What does ${brand} do? (${i + 1})`,
            acceptedAnswer: { '@type': 'Answer', text: fact },
          })),
        }] : []),
      ],
    };

    return NextResponse.json(jsonLd, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/ld+json',
      },
    });
  } catch (err: any) {
    console.error('schema-public error:', err);
    return NextResponse.json({ error: 'Failed to generate schema' }, { status: 500 });
  }
}
