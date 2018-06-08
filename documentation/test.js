var http = require("http");

var options = {
  "method": "POST",
  "hostname": [
    "https://api.prosperworks.com/developer_api/v1"
  ],
  "path": [
    "leads"
  ],
  "headers": {
    "X-PW-AccessToken": "<your_api_token>",
    "X-PW-Application": "developer_api",
    "X-PW-UserEmail": "<your_email_address>",
    "Content-Type": "application/json"
  }
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.write(JSON.stringify({ name: 'My Lead',
  email: { email: 'mylead@noemail.com', category: 'work' },
  phone_numbers: [ { number: '415-123-45678', category: 'mobile' } ],
  custom_fields: 
   [ { custom_field_definition_id: 100764,
       value: 'Text fields are 255 chars or less!' },
     { custom_field_definition_id: 103481,
       value: 'Text area fields can have long text content' } ],
  customer_source_id: 331242 }));
req.end();
