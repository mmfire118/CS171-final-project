import pandas as pd
from datetime import datetime

df = pd.read_csv('Electronics.csv')

def updateData(row):
    return datetime.utcfromtimestamp(int(row)).strftime('%Y-%m-%d')

df["timestamp"] = df["timestamp"].apply(updateData)

df.to_csv('Electronics.csv')