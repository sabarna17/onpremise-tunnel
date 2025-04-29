const express = require('express');
const app = express();
const sapCfAxios = require('sap-cf-axios').default;
// Get API key from environment variables.  If not found, throw an error.
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable not set.');
}
app.use(express.json());
let port = process.env['INTERNAL_PORT'] || 8080;

const axiosInstancefdd = sapCfAxios("SWIFTFDD");
const axiosInstancefddPOST = sapCfAxios( /* destination name */ "SWIFTFDD", /* axios default config */ null, /* xsrfConfig */ {method: 'get', url:'/'});
const axiosInstancetad = sapCfAxios("SWIFTTAD");
const axiosInstancetadPOST = sapCfAxios( /* destination name */ "SWIFTTAD", /* axios default config */ null, /* xsrfConfig */ {method: 'get', url:'/'});

// Middleware function to validate the API key
const apiKeyValidator = (req, res, next) => {
    const providedApiKey = req.headers['x-api-key']; // Or any other header you choose
  
    if (!providedApiKey) {
      return res.status(401).json({ error: 'API key missing' });
    }
  
    if (providedApiKey !== apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
  
    next(); // Proceed to the next middleware or route handler if the key is valid
  };

const executeRequest = async (method, url, swift_system, body = null) => {
    try {
        let headers = {}
        const config = {
            method: method,
            url: url,
            headers: headers,
        };

        if (body) {
            config.data = body;
        }
        if( swift_system === "SWIFTFDD") {
            if( method === 'POST' ) {
                config.xsrfHeaderName = "x-csrf-token";
                const response = await axiosInstancefddPOST.request(config);
                console.log(JSON.stringify(response.data));
                return response.data;                
            }
            else{
                const response = await axiosInstancefdd.request(config);
                console.log(JSON.stringify(response.data));
                return response.data;
            }
        }
        else{
            console.log(`I am here 2`);

            if( method === 'POST' ) {
                config.xsrfHeaderName = "x-csrf-token";
                const response = await axiosInstancetadPOST.request(config);
                console.log(JSON.stringify(response.data));
                return response.data;                
            }
            else{
                const response = await axiosInstancetad.request(config);
                console.log(JSON.stringify(response.data));
                return response.data;
            }            
        }
        
    } catch (error) {
        console.error('Error occurred during request execution:');
        if (error.response) {
            console.error('Response Data:', error.response.data);
            console.error('Response Status:', error.response.status);
            console.error('Response Headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error message:', error.message);
        }
        throw error;
    }
};

app.get('*', apiKeyValidator, async (req, res) => {
    try {
        const url = req.originalUrl;
        const fullUrl = url;
        const allHeaders = req.headers;
        
        let swift_system = allHeaders
        
        // let strs =  JSON.stringify(allHeaders)
        // req.getH
        // 
        // if( 'FDD' in strs){
        swift_system = allHeaders["swift_system"];
        console.log(`Executing GET request for system: ${swift_system}`);
        

        const response = await executeRequest('get', fullUrl, swift_system);

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process GET request' });
    }
});

console.log(`I am here 4`);

app.post('*', apiKeyValidator, async (req, res) => {
    try {
        console.log('Post Triggered Start-------------');
        const url = req.originalUrl;
        const fullUrl = url;
        let data;

        if (req.is('application/json')) {
            console.log('Processing JSON body');
            data = JSON.stringify(req.body);
        } else {
            data = req.rawBody;
        }
        const allHeaders = req.headers;
        let swift_system = allHeaders['SWIFT_SYSTEM']

        console.log('Request Data:', data);

        const response = await executeRequest('post', fullUrl, swift_system, data);

        console.log('Post Triggered End-------------');
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process POST request' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
