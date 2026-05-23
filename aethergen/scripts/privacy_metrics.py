#!/usr/bin/env python3
"""
Custom Privacy Metrics Implementation
Implements membership inference and attribute inference attacks
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score
import json
import sys

class PrivacyMetrics:
    def __init__(self):
        self.membership_model = None
        self.attribute_models = {}
        
    def membership_inference_attack(self, real_data, synthetic_data, target_column=None):
        """
        Implements membership inference attack
        Returns: AUC score, attack accuracy, description
        """
        try:
            # Prepare data for membership inference
            real_df = pd.DataFrame(real_data)
            synthetic_df = pd.DataFrame(synthetic_data)
            
            # Create membership labels (1 for real, 0 for synthetic)
            real_labels = np.ones(len(real_df))
            synthetic_labels = np.zeros(len(synthetic_df))
            
            # Combine data
            combined_data = pd.concat([real_df, synthetic_df], ignore_index=True)
            combined_labels = np.concatenate([real_labels, synthetic_labels])
            
            # Split into train/test
            X_train, X_test, y_train, y_test = train_test_split(
                combined_data, combined_labels, test_size=0.3, random_state=42
            )
            
            # Train membership inference model
            self.membership_model = RandomForestClassifier(n_estimators=100, random_state=42)
            self.membership_model.fit(X_train, y_train)
            
            # Predict and evaluate
            y_pred = self.membership_model.predict(X_test)
            y_pred_proba = self.membership_model.predict_proba(X_test)[:, 1]
            
            auc = roc_auc_score(y_test, y_pred_proba)
            accuracy = accuracy_score(y_test, y_pred)
            
            return {
                'auc': float(auc),
                'attack_accuracy': float(accuracy),
                'description': 'Membership inference attack using RandomForest classifier'
            }
            
        except Exception as e:
            return {
                'auc': 0.5,
                'attack_accuracy': 0.5,
                'description': f'Membership inference failed: {str(e)}'
            }
    
    def attribute_inference_attack(self, real_data, synthetic_data, target_column):
        """
        Implements attribute inference attack
        Returns: AUC score, attack accuracy, description
        """
        try:
            real_df = pd.DataFrame(real_data)
            synthetic_df = pd.DataFrame(synthetic_data)
            
            if target_column not in real_df.columns:
                return {
                    'auc': 0.5,
                    'attack_accuracy': 0.5,
                    'description': f'Target column {target_column} not found'
                }
            
            # Use synthetic data to train attribute inference model
            X_synthetic = synthetic_df.drop(columns=[target_column])
            y_synthetic = synthetic_df[target_column]
            
            # Test on real data
            X_real = real_df.drop(columns=[target_column])
            y_real = real_df[target_column]
            
            # Train model on synthetic data
            model = RandomForestClassifier(n_estimators=100, random_state=42)
            model.fit(X_synthetic, y_synthetic)
            
            # Test on real data
            y_pred = model.predict(X_real)
            y_pred_proba = model.predict_proba(X_real)[:, 1] if len(model.classes_) == 2 else None
            
            accuracy = accuracy_score(y_real, y_pred)
            auc = roc_auc_score(y_real, y_pred_proba) if y_pred_proba is not None else 0.5
            
            return {
                'auc': float(auc),
                'attack_accuracy': float(accuracy),
                'description': f'Attribute inference attack on {target_column}'
            }
            
        except Exception as e:
            return {
                'auc': 0.5,
                'attack_accuracy': 0.5,
                'description': f'Attribute inference failed: {str(e)}'
            }
    
    def data_leakage_assessment(self, real_data, synthetic_data):
        """
        Assesses data leakage risk
        Returns: leakage score, description
        """
        try:
            real_df = pd.DataFrame(real_data)
            synthetic_df = pd.DataFrame(synthetic_data)
            
            # Calculate statistical similarity
            real_stats = real_df.describe()
            synthetic_stats = synthetic_df.describe()
            
            # Calculate correlation between real and synthetic statistics
            correlation = np.corrcoef(real_stats.values.flatten(), synthetic_stats.values.flatten())[0, 1]
            
            # Convert to leakage score (0 = no leakage, 1 = complete leakage)
            leakage_score = max(0, min(1, (correlation + 1) / 2))
            
            return {
                'leakage_score': float(leakage_score),
                'description': 'Data leakage assessment based on statistical similarity'
            }
            
        except Exception as e:
            return {
                'leakage_score': 0.5,
                'description': f'Data leakage assessment failed: {str(e)}'
            }
    
    def reidentification_risk(self, real_data, synthetic_data):
        """
        Assesses re-identification risk
        Returns: risk score, description
        """
        try:
            real_df = pd.DataFrame(real_data)
            synthetic_df = pd.DataFrame(synthetic_data)
            
            # Calculate uniqueness in synthetic data
            synthetic_unique = synthetic_df.drop_duplicates()
            uniqueness_ratio = len(synthetic_unique) / len(synthetic_df)
            
            # Lower uniqueness = higher re-identification risk
            reidentification_risk = 1 - uniqueness_ratio
            
            return {
                'risk': float(reidentification_risk),
                'description': 'Re-identification risk based on data uniqueness'
            }
            
        except Exception as e:
            return {
                'risk': 0.5,
                'description': f'Re-identification risk assessment failed: {str(e)}'
            }

def main():
    if len(sys.argv) < 3:
        print("Usage: python privacy_metrics.py <real_data.json> <synthetic_data.json>")
        sys.exit(1)
    
    # Load data
    with open(sys.argv[1], 'r') as f:
        real_data = json.load(f)
    
    with open(sys.argv[2], 'r') as f:
        synthetic_data = json.load(f)
    
    # Initialize privacy metrics
    privacy = PrivacyMetrics()
    
    # Run privacy assessments
    membership_results = privacy.membership_inference_attack(real_data, synthetic_data)
    attribute_results = privacy.attribute_inference_attack(real_data, synthetic_data, 'target_column')
    leakage_results = privacy.data_leakage_assessment(real_data, synthetic_data)
    reidentification_results = privacy.reidentification_risk(real_data, synthetic_data)
    
    # Compile results
    results = {
        'membership_inference': membership_results,
        'attribute_inference': attribute_results,
        'data_leakage': leakage_results,
        'reidentification': reidentification_results
    }
    
    # Output results
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main() 