import pandas as pd
import os
from datetime import datetime
import json

folder = 'reviews'

workingDirectory = os.getcwd() + "/" + folder

FRACTION = 0.02

print("Generating File List!")

# Generate List of All Bulk CSV Files
f = []
for (dirpath, dirnames, filenames) in os.walk(workingDirectory):
    for innerFile in filenames:
        if innerFile.endswith(".json"):
            f.append(innerFile)
    break

# Run Script for every file in list
df_list = {}

for count, filename in enumerate(f, start=1):
    print("Reading " + filename + ": " + str(count) + "/" + str(len(f)))

    tempPath = './' + folder + "/" + filename

    # Load Data into Dataframe
    df = pd.read_json(tempPath, lines=True)

    # Select Random Percentage of Data
    df = df.sample(frac=FRACTION)

    # Drop Null Values with No Helpful Votes
    df = df.dropna(axis=0, subset=['vote'])

    # Convert Strings to Ints
    df['vote'] = df['vote'].str.replace(',', '').astype(int)

    # Split DF Data by Ratings
    itemizedList = [df[df['overall'] == 1.0], df[df['overall'] == 2.0], df[df['overall'] == 3.0], df[df['overall'] == 4.0], df[df['overall'] == 5.0]]

    # Sum Helpful Votes
    category = filename.replace("_", " ")[:-5]

    df_list[category] = {}

    for count, rating in enumerate(itemizedList, start=1):
        df_list[category][count] = rating['vote'].sum()
    
with open('helpful.json', 'w') as fp:
    json.dump(df_list, fp)