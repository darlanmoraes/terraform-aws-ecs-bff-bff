const express = require("express");
const proxy = require("express-http-proxy");
const app = express();
const port = 8080;
const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION
});
const elbv2 = new AWS.ELBv2();

const DNSPrefix = "internal-tenant-";
const LoadBalancers = {};

setInterval(async () => {
  try {
    console.log("Loading LoadBalancers...");
    const response = await elbv2.describeLoadBalancers({}).promise();
    for (const LoadBalancer of response.LoadBalancers) {
      const { DNSName } = LoadBalancer;
      if (DNSName.startsWith(DNSPrefix)) {
        const DNSKey = DNSName.replace(DNSPrefix, "").split("-")[0];
        Object.assign(LoadBalancers, { [DNSKey]: DNSName })
      }
    }
    console.log(`Loaded LoadBalancers... ${JSON.stringify(LoadBalancers)}`);
  } catch(e) {
    console.error("Failure Loading LoadBalancers...", e);
  }
}, 10 * 1000);

function getLoadBalancer(req) {
  return LoadBalancers[req.query.app];
}

app.get("/", (req, res) => {
  res.send("{\"status\": \"ok\"}");
})

app.use("/proxy", proxy(getLoadBalancer));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})