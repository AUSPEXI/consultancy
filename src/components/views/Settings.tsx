import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

export function Settings() {
  const { user, userData } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    domain: '',
    cmsWebhookUrl: '',
    keyword1: '',
    keyword2: '',
    keyword3: '',
    competitor1: '',
    competitor2: '',
    competitor3: '',
    competitor4: ''
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        brand: userData.brand || '',
        domain: userData.domain || '',
        cmsWebhookUrl: userData.cmsWebhookUrl || '',
        keyword1: userData.keywords?.[0] || '',
        keyword2: userData.keywords?.[1] || '',
        keyword3: userData.keywords?.[2] || '',
        competitor1: userData.competitors?.[0] || '',
        competitor2: userData.competitors?.[1] || '',
        competitor3: userData.competitors?.[2] || '',
        competitor4: userData.competitors?.[3] || '',
      });
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const competitors = [
        formData.competitor1,
        formData.competitor2,
        formData.competitor3,
        formData.competitor4
      ].filter(Boolean);
      
      const keywords = [
        formData.keyword1,
        formData.keyword2,
        formData.keyword3
      ].filter(Boolean);

      await updateDoc(userRef, {
        brand: formData.brand,
        domain: formData.domain,
        cmsWebhookUrl: formData.cmsWebhookUrl,
        competitors,
        keywords
      });
      console.log('Settings updated successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Account Settings</h1>
        <p className="text-zinc-400">Manage your brand profile and Auspexi configuration.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Profile & Brand</CardTitle>
          <CardDescription className="text-zinc-400">The core information Auspexi uses to evaluate your AI Share of Voice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Account Email</label>
            <Input disabled value={user?.email || ''} className="bg-zinc-950 border-zinc-800 text-zinc-500" />
            <p className="text-xs text-zinc-500">Contact support to change your account email.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Brand Name</label>
              <Input name="brand" value={formData.brand} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Primary Domain</label>
              <Input name="domain" value={formData.domain} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" placeholder="e.g. acme.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Target Keywords</CardTitle>
          <CardDescription className="text-zinc-400">The primary topics we track for AI citations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Keyword 1</label>
              <Input name="keyword1" value={formData.keyword1} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Keyword 2</label>
              <Input name="keyword2" value={formData.keyword2} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Keyword 3</label>
              <Input name="keyword3" value={formData.keyword3} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Competitor Tracking</CardTitle>
          <CardDescription className="text-zinc-400">Identify who you are racing against for LLM consensus.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Competitor 1</label>
              <Input name="competitor1" value={formData.competitor1} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Competitor 2</label>
              <Input name="competitor2" value={formData.competitor2} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Competitor 3</label>
              <Input name="competitor3" value={formData.competitor3} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Competitor 4</label>
              <Input name="competitor4" value={formData.competitor4} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Integrations</CardTitle>
          <CardDescription className="text-zinc-400">Connect Auspexi to your existing infrastructure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Platform Webhook URL</label>
            <Input name="cmsWebhookUrl" value={formData.cmsWebhookUrl} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" placeholder="https://your-cms.com/api/webhooks/auspexi" />
            <p className="text-xs text-zinc-500">Provide the webhook URL for your CMS or backend application. Auspexi will use this endpoint to automatically sync approved data, inject schema updates, distribute content, and push real-time platform events.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving} className="bg-white text-zinc-900 hover:bg-zinc-200">
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
