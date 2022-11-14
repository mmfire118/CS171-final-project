import pandas as pd
import os
from datetime import datetime

folder = 'bulk'

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
df_list = []

for count, filename in enumerate(f, start=1):
    print("Modifying " + filename + ": " + str(count) + "/" + str(len(f)))

    tempPath = './' + folder + "/" + filename
    
    # Load Data into Dataframe
    df = pd.read_json(tempPath, lines=True)

    # Select Random Percentage of Data
    df = df.sample(frac=FRACTION)

    # Create Ideal Rows
    Item_ID = (df['asin']).tolist()

    Rating = (df['overall']).tolist()

    Timestamp = [datetime.strptime(x, "%m %d, %Y").strftime('%Y-%m-%d') for x in df['reviewTime']]

    Num_Words = [len(str(x).split()) for x in df['reviewText']]

    Category = [(filename.replace("5", "").replace("_", " ")[:-6])] * len(Num_Words)

    df = pd.DataFrame({'Item_ID':Item_ID, 'Rating':Rating, 'Timestamp':Timestamp, 'Num_Words':Num_Words, 'Category':Category})

    df_list.append(df)

df = pd.concat(df_list)

df.to_csv('out.csv')