import express from "express";
// import { MCPClient } from './src/MCPClient.js'
import dotenv from "dotenv";
import { MCPClient } from './index-mcp.js';
dotenv.config();
const app = express();
const port = 3000;
app.use(express.json());
const mcp = new MCPClient();
await mcp.connectToServer(process.argv[2]);
app.get('/', async (req, res) => {
    // const response = await mcp.processQuery({
    //   role: 'user',
    //   content: [
    //     {
    //       type: 'text',
    //       text: 'Achudame con la casa, plis'
    //     }
    //   ]});
    // res.jsonp(response)
});
app.post('/message', async (req, res) => {
    console.log('text', req.body);
    const response = await mcp.processQuery(req.body.text);
    res.jsonp(response);
});
app.listen(port, () => {
    console.log("Server running at PORT: ", port);
}).on("error", (error) => {
    // gracefully handle error
    throw new Error(error.message);
});
