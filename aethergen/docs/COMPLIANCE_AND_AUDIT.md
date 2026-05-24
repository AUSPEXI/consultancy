# Compliance & Audit Guide

## Company Information
- Website: Auspexi.com
- Email: sales@auspexi.com
- Address: Bridge Street, Guildford, Surrey, UK

## Overview
Scope: privacy, lineage, and operational auditability for regulated sectors including healthcare, finance, and government.

## Privacy Controls

### Differential Privacy
- ε Governance: Budget tracking with evidence records
- Privacy Panel: Real-time privacy metrics and controls
- Configurable Levels: Adjustable privacy vs. utility trade-offs
- Audit Trail: Complete ε usage tracking and reporting

### Data Cleaning Pipeline
- Deterministic Config: Reproducible cleaning processes
- Comprehensive Reports: Detailed transformation documentation
- Evidence Collection: Counts and transforms included in evidence bundles
- Quality Assurance: Automated quality validation at scale

## Lineage & Provenance

### Hash-Based Tracking
- Schema Hash: Unique identifier for data schemas
- Recipe Hash: Ablation recipe verification
- Run Seed: Reproducible generation seeds
- Evidence Bundles: Complete lineage documentation

### Audit Trail Procedures
- Dataset Releases: Evidence bundle URI in Unity Catalog table properties
- README/Datasheet: Comprehensive dataset documentation
- Version Control: Complete version history and changelog
- Access Logging: User access and modification tracking

## Mathematical Proofs

### ZK-SNARK Implementation
- Development Path: Current implementation status
- Fallback Proofs: Alternative verification methods
- Verification Hooks: Integration points for external verification
- Budget Adherence: ZK-UPB scaffold for privacy budget compliance

### Model Risk Management
- Model Collapse Risk Dial: Real-time risk assessment
- Human-in-the-Loop: HCA abstention mechanisms
- ACI Thresholds: Autopilot confidence intervals
- Risk Mitigation: Automated risk reduction strategies

## Sampling & Reproducibility

### Data Generation
- Run Seeds: Always stored for reproducibility
- Date/Version: Complete temporal tracking
- Sample Previews: Marketplace preview tables
- Quality Metrics: Statistical fidelity validation

### Optimization Process
- Publish Scripts: Use `notebooks/optimize_and_publish.py`
- Version Retention: Previous versions as `vN` tables
- Performance Tracking: Generation speed and efficiency metrics
- Scalability Validation: Proven at 1 BILLION+ records

## Data Subject Protection

### Current Implementation
- No Real Data: Synthetic data only, no PII exposure
- Local Processing: Seed handling remains local/offline in MVP
- Encrypted Storage: Future encrypted upload with DP policies
- Access Controls: Role-based access and authentication

### Future Enhancements
- Encrypted Uploads: Secure data transfer protocols
- DP Policies: Configurable privacy policies
- Audit Logging: Complete access and modification logs
- Compliance Reporting: Automated regulatory compliance reports

## Incident Response

### Security Incidents
- Revoke Shares: Immediate Delta Sharing revocation
- Marketplace Delisting: Rapid removal from marketplace
- Key Rotation: Stripe keys and webhook security
- Hotfix Deployment: `vN+1` releases with changelog notes

### Response Timeline
- Immediate: Within 1 hour of detection
- Assessment: Complete within 24 hours
- Communication: Stakeholder notification within 8 hours
- Resolution: Target resolution within 72 hours

## Regulatory Compliance

### Healthcare (HIPAA)
- Privacy Controls: Built-in HIPAA compliance features
- Audit Trails: Complete access and modification logging
- Data Encryption: End-to-end encryption for all data
- Access Controls: Role-based access and authentication

### Finance (SOX)
- Financial Controls: SOX-compliant data handling
- Audit Documentation: Complete audit trail maintenance
- Risk Assessment: Automated risk evaluation and reporting
- Compliance Monitoring: Real-time compliance status

### Government (FOIA)
- Public Data: FOIA-compliant data generation
- Transparency: Complete documentation and evidence
- Access Controls: Appropriate access level management
- Audit Requirements: Government audit compliance

## Evidence Bundle Requirements

### Compliance Documentation
- Privacy Metrics: Complete privacy preservation evidence
- Quality Validation: Statistical fidelity and utility metrics
- Cost Analysis: Platform costs and efficiency gains
- ROI Analysis: Return on investment calculations

### Audit Artifacts
- Schema Documentation: Complete field definitions and constraints
- Processing Logs: Step-by-step data generation logs
- Quality Reports: Automated quality assessment results
- Compliance Certificates: Regulatory compliance validation

## Support & Contact

### Compliance Questions
- Email: sales@auspexi.com
- Website: https://auspexi.com
- Documentation: https://auspexi.com/resources

### Audit Support
- Evidence Bundles: Complete audit trail documentation
- Compliance Reports: Automated regulatory compliance reports
- Technical Support: Expert assistance with compliance requirements
- Training Programs: Compliance and audit training available


