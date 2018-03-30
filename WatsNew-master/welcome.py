import os
from flask import Flask, jsonify, request
from watson_developer_cloud import DiscoveryV1

discovery_username = "dbcb8415-2809-4f1f-8ea9-b43105110d39"
discovery_password = "dPrMihVNfd8n"
collection_id      = "a389139d-9d7f-4c02-907b-7e2e4e128616"
enivornment_id     = "558ce587-866e-4f41-b3aa-7c3f1a983e55"

discovery = DiscoveryV1(
  username=discovery_username,
  password=discovery_password,
  version='2017-07-19'
)

app = Flask(__name__)

@app.route('/')
def Welcome():
    return app.send_static_file('index.html')

@app.route('/analyze', methods=["GET", "POST"])
def AnalyzeRequest():
    qopts = {
        'natural_language_query': request.form['query'],
        'passages': True}
    my_query = discovery.query(enivornment_id, collection_id, qopts)

    return jsonify(my_query)

port = os.getenv('PORT', '5000')
if __name__ == "__main__":
	app.run(host='0.0.0.0', port=int(port), debug=True)
