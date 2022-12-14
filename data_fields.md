# Data Field Explanation

This file explains the data fields in each of our files.

## out.csv
- Item_ID: The unique ID Amazon assigns to each product.
- Rating: The amount of stars for a particular review. This value is between 1 and 5, inclusive.
- Timestamp: The time at which the review was written.
- Num_Words: The number of words in the review.
- Category: The Amazon category of the product. Some examples include "Video Games" and "Clothing Shoes and Jewelry."

## stopWords.json
This file simply contains an array of strings called "stopwords." These are the words that are filtered out of our word bubble array by default. This is so that we don't show words like "the" or "and" among the most common words in Amazon reviews. 

## wordCount.json
This file contains a series of nested dictionaries. The outermost level contains Amazon product categories as the keys. These keys map to a list of 5 dictionaries, one for each star rating 1 through 5. Each of these 5 dictionaries contains a list of words mapped to numbers, where the numbers indicate how many times that word appeared in reviews with a specific number of stars for products in a specific category.

### A Note on the Original Database
The size of our original dataset was too big to upload. You can access it at the following link: https://nijianmo.github.io/amazon/index.html.