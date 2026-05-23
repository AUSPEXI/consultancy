import json
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors

app = FastAPI()

# Allow CORS for local dev and Netlify frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_csv_or_json(file: UploadFile):
    content = file.file.read()
    try:
        # Try CSV
        df = pd.read_csv(pd.compat.StringIO(content.decode()))
    except Exception:
        # Try JSON
        df = pd.read_json(content)
    return df

def parse_pasted_json(data: str):
    try:
        arr = json.loads(data)
        df = pd.DataFrame(arr)
        return df
    except Exception:
        return None

def nearest_neighbor_score(real_df, synth_df):
    # Simple nearest neighbor distance (memorization risk)
    real = real_df.select_dtypes(include=[np.number]).to_numpy()
    synth = synth_df.select_dtypes(include=[np.number]).to_numpy()
    if real.shape[1] == 0 or synth.shape[1] == 0:
        return 100  # No numeric data, assume safe
    nbrs = NearestNeighbors(n_neighbors=1).fit(real)
    distances, _ = nbrs.kneighbors(synth)
    # Score: higher mean distance = safer
    mean_dist = np.mean(distances)
    score = min(100, max(0, mean_dist * 20))  # Scale for demo
    return round(score, 2)

def membership_inference_score(real_df, synth_df):
    # Dummy: if synth rows are identical to real, risk is high
    overlap = pd.merge(real_df, synth_df, how='inner').shape[0]
    risk = min(100, overlap * 10)
    return 100 - risk  # Higher is safer

def attribute_disclosure_score(real_df, synth_df):
    # Dummy: if synth columns match real, risk is higher
    shared_cols = set(real_df.columns) & set(synth_df.columns)
    score = 100 - (len(shared_cols) / max(1, len(real_df.columns))) * 30
    return round(score, 2)

@app.post("/api/privacy-metrics")
async def privacy_metrics(
    real_file: UploadFile = File(None),
    synth_file: UploadFile = File(None),
    real_json: str = Form(None),
    synth_json: str = Form(None)
):
    # Parse real data
    if real_file:
        real_df = parse_csv_or_json(real_file)
    elif real_json:
        real_df = parse_pasted_json(real_json)
    else:
        return JSONResponse({"error": "No real data provided"}, status_code=400)

    # Parse synthetic data
    if synth_file:
        synth_df = parse_csv_or_json(synth_file)
    elif synth_json:
        synth_df = parse_pasted_json(synth_json)
    else:
        return JSONResponse({"error": "No synthetic data provided"}, status_code=400)

    # Compute privacy metrics
    nn_score = nearest_neighbor_score(real_df, synth_df)
    mi_score = membership_inference_score(real_df, synth_df)
    ad_score = attribute_disclosure_score(real_df, synth_df)

    return {
        "nearest_neighbor": nn_score,
        "membership_inference": mi_score,
        "attribute_disclosure": ad_score
    }

from mangum import Mangum
handler = Mangum(app) 