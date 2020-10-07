const express = require("express");
const proxy = require("express-http-proxy");
const app = express();
const port = 8080;
const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION
});
const elbv2 = new AWS.ELBv2();

const DNSPrefix = "internal-";
const DNSSuffix = "LoadBalancer";
const LoadBalancers = [];

setInterval(async () => {
  try {
    LoadBalancers.splice(0, LoadBalancers.length);
    const response = await elbv2.describeLoadBalancers({}).promise();
    for (const LoadBalancer of response.LoadBalancers) {
      const { DNSName } = LoadBalancer;
      if (DNSName.startsWith(DNSPrefix)) {
        const DNSKey = DNSName.replace(DNSPrefix, "").split(DNSSuffix)[0];
        LoadBalancers.push({
          client: DNSKey,
          path: `/backend-for-frontend/app/api/execute?client=${DNSKey}`,
          internal: `http://${DNSName}`
        });
      }
    }
  } catch(e) {
    console.error("Can't find LoadBalancers...", e);
  }
}, 10 * 1000);

function getMatch(req) {
  const client = req.query.client;
  const match = LoadBalancers.filter(LoadBalancer => LoadBalancer.client === client);
  if (match.length) {
    return match[0].internal;
  }
}

app.get("/", (req, res) => {
  res.send({ camunda: LoadBalancers });
})

app.use("/backend-for-frontend", proxy(getMatch, {
  filter: (req, res) => {
    const match = !!getMatch(req);
    if (!match) {
      res.status(404)
         .send({ status: "Not Found" });
    }
    return match;
  }
}));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})