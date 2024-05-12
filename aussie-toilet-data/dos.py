import requests
import time

IP = 'http://10.13.44.28:5000/viz/stuart'

while(True):
    r = requests.get(url=IP)
    print("request");

