const http = require('http');
const req = http.request('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.stringify(JSON.parse(data), null, 2)));
});

req.write(JSON.stringify({
  query: `query { adminEventAnalytics(input: {first: 10}) { platformSummary { totalEvents totalPublishedEvents } events { nodes { eventId title status } totalCount } } }`
}));
req.end();
