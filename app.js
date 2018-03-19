const express = require("express");
const app = express();
const cc = require('cryptocompare');
global.fetch = require('node-fetch');

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    cc.coinList().then(coinList => {
        coinList = coinList.Data;
        const infoList = [];
        for (const key of Object.keys(coinList)) {
            infoList.push(coinList[key]);
        }
        const sorted = infoList.sort((a, b) => a.SortOrder - b.SortOrder);
        const ranks = sorted.map(cur => cur.SortOrder);
        const symbols = sorted.map(cur => cur.Symbol);
        const names = sorted.map(cur => cur.CoinName);
        const algs = sorted.map(cur => cur.Algorithm);
        const imgs = sorted.map(cur => cur.ImageUrl);
        const proofs = sorted.map(cur => cur.ProofType);
        const maxSupplies = sorted.map(cur => cur.TotalCoinSupply);
        res.render("index", {
                                symbols: symbols,
                                names: names,
                                ranks: ranks,
                                algs: algs,
                                imgs: imgs,
                                proofs: proofs,
                                maxSupplies: maxSupplies
                            });
    }).catch(console.error);
});

app.listen(4000, () => {
    console.log("The server has started YOOO !!");
});
