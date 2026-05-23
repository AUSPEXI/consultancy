export type LocalTaskType = 'auto' | 'classification' | 'regression';
export type LocalBackend = 'sklearn' | 'pytorch' | 'tensorflow';

export function buildLocalTrainingScript(options: {
  targetColumn: string;
  task: LocalTaskType;
  backend?: LocalBackend;
}): string {
  const { targetColumn, task, backend = 'sklearn' } = options;
  const ts = new Date().toISOString();
  if (backend === 'pytorch') return buildTorchScript(targetColumn, task, ts);
  if (backend === 'tensorflow') return buildTfScript(targetColumn, task, ts);
  return `# AethergenAI Local Training Script
# Generated: ${ts}
# Usage:
#   python train_baseline.py --input synthetic_data.csv --target ${targetColumn} --task ${task}

import argparse, os, json
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score, accuracy_score, classification_report, r2_score, mean_absolute_error
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
import joblib

try:
    import mlflow
    MLFLOW_AVAILABLE = True
except Exception:
    MLFLOW_AVAILABLE = False


def load_table(path: str) -> pd.DataFrame:
    if path.lower().endswith('.csv'):
        return pd.read_csv(path)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return pd.DataFrame(data)


parser = argparse.ArgumentParser()
parser.add_argument('--input', required=True, help='Path to CSV or JSON synthetic dataset')
parser.add_argument('--target', required=True, help='Target column name')
parser.add_argument('--task', default='auto', choices=['auto','classification','regression'])
args = parser.parse_args()

df = load_table(args.input)
if args.target not in df.columns:
    raise SystemExit(f'Target column {args.target!r} not in dataset columns: {list(df.columns)}')

# Basic cleaning: drop fully empty columns
df = df.dropna(axis=1, how='all')

# Simple type inference for task if auto
if args.task == 'auto':
    if pd.api.types.is_numeric_dtype(df[args.target]) and df[args.target].nunique() > 20:
        task = 'regression'
    else:
        task = 'classification'
else:
    task = args.task

X = df.drop(columns=[args.target])
y = df[args.target]

# One-hot encode non-numeric for a quick baseline
X = pd.get_dummies(X, drop_first=True)

# Align any non-numeric y for classification
if task == 'classification' and not pd.api.types.is_integer_dtype(y) and not pd.api.types.is_bool_dtype(y):
    y = y.astype('category').cat.codes

strat = y if (task=='classification' and y.nunique() < 50) else None
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=strat)

if task == 'classification':
    model = RandomForestClassifier(n_estimators=400, max_depth=None, n_jobs=-1, random_state=42)
else:
    model = RandomForestRegressor(n_estimators=400, n_jobs=-1, random_state=42)

model.fit(Xtr, ytr)
yp = model.predict(Xte)

metrics = {}
if task == 'classification':
    metrics['f1_macro'] = float(f1_score(yte, yp, average='macro'))
    metrics['accuracy'] = float(accuracy_score(yte, yp))
    print('F1(macro):', metrics['f1_macro'])
    print('Accuracy:', metrics['accuracy'])
    try:
        print(classification_report(yte, yp))
    except Exception:
        pass
else:
    metrics['r2'] = float(r2_score(yte, yp))
    metrics['mae'] = float(mean_absolute_error(yte, yp))
    print('R2:', metrics['r2'])
    print('MAE:', metrics['mae'])

joblib.dump(model, 'model.joblib')
print('Model saved to model.joblib')

# Optional MLflow logging (works with local or Databricks if env is configured)
if MLFLOW_AVAILABLE:
    try:
        mlflow.set_experiment('aethergen_local')
        with mlflow.start_run():
            for k,v in metrics.items():
                mlflow.log_metric(k, v)
            mlflow.sklearn.log_model(model, 'model')
            mlflow.log_artifact(args.input)
            mlflow.log_text(json.dumps({'task': task, 'target': args.target}), 'run_meta.json')
        print('Logged to MLflow')
    except Exception as e:
        print('MLflow logging skipped:', e)
`;
}

export function downloadScriptFile(content: string, filename: string = 'train_baseline.py') {
  const blob = new Blob([content], { type: 'text/x-python' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildRequirements(backend: LocalBackend): string {
  const common = ['pandas', 'scikit-learn', 'mlflow>=2.9.0'];
  if (backend === 'sklearn') return [...common, 'joblib'].join('\n') + '\n';
  if (backend === 'pytorch') return [...common, 'torch', 'numpy'].join('\n') + '\n';
  return [...common, 'tensorflow>=2.14.0', 'numpy'].join('\n') + '\n';
}

export function buildReadmeSnippet(options: { backend: LocalBackend; target: string }): string {
  const { backend, target } = options;
  const file = 'synthetic_data.csv';
  return `# AethergenAI Local Training ( ${backend} )\n\n## Setup\npython -m venv .venv\n. .venv/bin/activate  # Windows: .venv\\\\Scripts\\\\activate\npip install -r requirements.txt\n\n## Train\npython train_baseline.py --input ${file} --target ${target} --task auto\n`;
}

function buildTorchScript(targetColumn: string, task: LocalTaskType, ts: string): string {
  return `# AethergenAI Local Training Script (PyTorch)\n# Generated: ${ts}\n\nimport argparse, json\nimport pandas as pd\nimport numpy as np\nfrom sklearn.model_selection import train_test_split\nimport torch\nimport torch.nn as nn\nfrom torch.utils.data import TensorDataset, DataLoader\n\ntry:\n    import mlflow\n    MLFLOW_AVAILABLE = True\nexcept Exception:\n    MLFLOW_AVAILABLE = False\n\nparser = argparse.ArgumentParser()\nparser.add_argument('--input', required=True)\nparser.add_argument('--target', required=True)\nparser.add_argument('--task', default='auto', choices=['auto','classification','regression'])\nparser.add_argument('--epochs', type=int, default=10)\nparser.add_argument('--batch_size', type=int, default=128)\nparser.add_argument('--lr', type=float, default=1e-3)\nparser.add_argument('--hidden', type=int, default=128)\nargs = parser.parse_args()\n\ndf = pd.read_csv(args.input) if args.input.lower().endswith('.csv') else pd.DataFrame(json.load(open(args.input)))\nif args.target not in df.columns: raise SystemExit('target not in columns')\n\nif args.task == 'auto':\n    task = 'regression' if pd.api.types.is_numeric_dtype(df[args.target]) and df[args.target].nunique()>20 else 'classification'\nelse:\n    task = args.task\n\nX = pd.get_dummies(df.drop(columns=[args.target]), drop_first=True)\ny_raw = df[args.target]\nif task=='classification': y = y_raw.astype('category').cat.codes.values.astype(np.int64)\nelse: y = y_raw.values.astype(np.float32)\n\nXtr, Xte, ytr, yte = train_test_split(X.values.astype(np.float32), y, test_size=0.2, random_state=42, stratify=(y if task=='classification' and len(np.unique(y))<50 else None))\n\ninput_dim = Xtr.shape[1]\nnum_classes = int(np.max(y)+1) if task=='classification' else 1\n\nclass MLP(nn.Module):\n    def __init__(self, inp, hid, out):\n        super().__init__()\n        self.net = nn.Sequential(nn.Linear(inp,hid), nn.ReLU(), nn.Linear(hid,out))\n    def forward(self, x): return self.net(x)\n\nmodel = MLP(input_dim, args.hidden, num_classes)\nopt = torch.optim.Adam(model.parameters(), lr=args.lr)\ncrit = nn.CrossEntropyLoss() if task=='classification' else nn.MSELoss()\n\ntr_ds = TensorDataset(torch.from_numpy(Xtr), torch.from_numpy(ytr))\nte_ds = TensorDataset(torch.from_numpy(Xte), torch.from_numpy(yte))\ntr_dl = DataLoader(tr_ds, batch_size=args.batch_size, shuffle=True)\n\ndef eval_acc():\n    model.eval()\n    with torch.no_grad():\n        Xb, yb = te_ds[:]\n        out = model(Xb)\n        if task=='classification':\n            pred = out.argmax(dim=1)\n            acc = (pred==yb).float().mean().item()\n            return {'accuracy': acc}\n        else:\n            mse = ((out.squeeze()-yb)**2).mean().item()\n            return {'mse': mse}\n\nfor epoch in range(args.epochs):\n    model.train()\n    for xb, yb in tr_dl:\n        opt.zero_grad()\n        out = model(xb)\n        loss = crit(out, yb if task=='classification' else yb.view(-1,1))\n        loss.backward(); opt.step()\n\nmetrics = eval_acc(); print(metrics)\nimport joblib; joblib.dump(model.state_dict(), 'model_state.pt')\n\nif MLFLOW_AVAILABLE:\n    try:\n        mlflow.set_experiment('aethergen_local')\n        with mlflow.start_run():\n            for k,v in metrics.items(): mlflow.log_metric(k, float(v))\n            mlflow.log_artifact(args.input)\n            mlflow.log_text(str(metrics), 'metrics.txt')\n    except Exception as e:\n        print('MLflow logging skipped:', e)\n`;
}

function buildTfScript(targetColumn: string, task: LocalTaskType, ts: string): string {
  return `# AethergenAI Local Training Script (TensorFlow)\n# Generated: ${ts}\n\nimport argparse, json\nimport pandas as pd\nimport numpy as np\nfrom sklearn.model_selection import train_test_split\nimport tensorflow as tf\n\ntry:\n    import mlflow\n    MLFLOW_AVAILABLE = True\nexcept Exception:\n    MLFLOW_AVAILABLE = False\n\nparser = argparse.ArgumentParser()\nparser.add_argument('--input', required=True)\nparser.add_argument('--target', required=True)\nparser.add_argument('--task', default='auto', choices=['auto','classification','regression'])\nparser.add_argument('--epochs', type=int, default=10)\nparser.add_argument('--batch_size', type=int, default=128)\nparser.add_argument('--hidden', type=int, default=128)\nargs = parser.parse_args()\n\ndf = pd.read_csv(args.input) if args.input.lower().endswith('.csv') else pd.DataFrame(json.load(open(args.input)))\nif args.target not in df.columns: raise SystemExit('target not in columns')\n\nif args.task == 'auto':\n    task = 'regression' if pd.api.types.is_numeric_dtype(df[args.target]) and df[args.target].nunique()>20 else 'classification'\nelse:\n    task = args.task\n\nX = pd.get_dummies(df.drop(columns=[args.target]), drop_first=True)\ny_raw = df[args.target]\nif task=='classification': y = y_raw.astype('category').cat.codes.values.astype(np.int64)\nelse: y = y_raw.values.astype(np.float32)\n\nXtr, Xte, ytr, yte = train_test_split(X.values.astype(np.float32), y, test_size=0.2, random_state=42, stratify=(y if task=='classification' and len(np.unique(y))<50 else None))\n\ninput_dim = Xtr.shape[1]\nnum_classes = int(np.max(y)+1) if task=='classification' else 1\n\nmodel = tf.keras.Sequential([tf.keras.layers.Input(shape=(input_dim,)), tf.keras.layers.Dense(args.hidden, activation='relu'), tf.keras.layers.Dense(num_classes)])\nif task=='classification':\n    loss = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)\n    metrics=['accuracy']\nelse:\n    loss = 'mse'\n    metrics=['mse']\nmodel.compile(optimizer=tf.keras.optimizers.Adam(1e-3), loss=loss, metrics=metrics)\n\nh = model.fit(Xtr, ytr, validation_split=0.1, epochs=args.epochs, batch_size=args.batch_size, verbose=0)\nresults = model.evaluate(Xte, yte, verbose=0)\nprint(dict(zip(model.metrics_names, [float(r) for r in results])))\nmodel.save('model_tf')\n\nif MLFLOW_AVAILABLE:\n    try:\n        mlflow.set_experiment('aethergen_local')\n        with mlflow.start_run():\n            mlflow.log_artifact(args.input)\n            mlflow.log_text(str(dict(zip(model.metrics_names, [float(r) for r in results]))), 'metrics.txt')\n    except Exception as e:\n        print('MLflow logging skipped:', e)\n`;
}
