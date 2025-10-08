# Prints a list of tags found in dataset_1.json
import json

data = []
with open("dataset_1.json", "r") as file:
    for line in file:
        data.append(json.loads(line))

tags_list = []    
for d in data:
    if(d['Tags']) != None:
        tags = d['Tags'].split(",")
        for tag in tags:
            if tag not in tags_list:
                tags_list.append(tag)
            
tags_list.sort()      
# print(tags_list)
for tag in tags_list:
    print("\"{0}\" tinyint,".format(tag))
