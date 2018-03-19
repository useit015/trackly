const ohlc = new Graph(".chart", 168, "histohour");
const init = () => {
    const fiatBtn = document.querySelector(".dashboard__fiat");
    const fiatList = fiatBtn.querySelector(".dashboard__fiat-list");
    const searchInput = document.querySelector(".crypto-nav__input");
    const suggestionsList = document.querySelector(".suggestions");
    const displayMatches = function() {
        const findMatches = (input, list) => {
            if (input.length > 0) {
                return list.filter(cur => {
                    const regex = new RegExp(input, "gi");
                    return cur.name.match(regex) || cur.symbol.match(regex);
                });
            } else {
                return [];
            }
        };
        const matchArray = findMatches(this.value, processed).slice(0, 10);
        document.querySelector(".suggestions").innerHTML = matchArray.map(cur => {
            const url = svgs.includes(cur.symbol) ? `/img/crypto/${cur.symbol.toLowerCase()}.svg` : cur.imgUrl;
            return `<li class="suggestions__item" data-currency="${cur.symbol}"><img src="${url}" alt="" class="suggestions__item-icon">${cur.name} <span class="suggestions__item-symbol" data-currency="${cur.symbol}">(${cur.symbol})</span></li>`;
        }).join("");
    };
    const selectFromSearch = function(event){
        selectedCoin = event.target.dataset.currency;
        getCurrentPrice(selectedCoin);
        ohlc.getData(selectedCoin, selectedCurrency, "update");
        searchInput.value = "";
        this.innerHTML = "";
    };
    const populateCryptoNav = () => {
        const populateList = (list) => {
            return list.map(cur => `<li class="currency" data-currency="${cur}"><div class="currency__coin"><img src="" alt="" class="currency__coin-icon"><div class="currency__coin-name"><p class="name"></p><div class="change"></div><p class="symb"></p></div></div><div class="currency__coin-details"><p class="price"></p><p class="percentage"></p></div></li>`).join("")
        };
        document.querySelector(".favourite-currencies__list").innerHTML = populateList(fav);
        document.querySelector(".other-currencies__list").innerHTML = populateList(other);
        document.querySelectorAll(".currency").forEach(cur => cur.addEventListener("click", () => {
            selectedCoin = cur.dataset.currency;
            getCurrentPrice(selectedCoin);
            ohlc.getData(selectedCoin, selectedCurrency, "update");
        }));
    };
    const populateFiatList = (list) => {
        fiatList.innerHTML = list.map(cur => {
            if (cur.name != selectedCurrency) {
                return `<li class="dashboard__fiat-list__item" data-fiat="${cur.name}">${cur.name}</li>`;
            }
        }).join("");
    };
    const toggleFiatList = () => {
        fiatBtn.classList.toggle("shown");
    };
    const changeSelectedFiat = (event) => {
        if (event.target.classList.contains("dashboard__fiat-list__item")) {
            selectedCurrency = event.target.dataset.fiat;
            getCurrentPrice(selectedCoin);
            fiatBtn.dataset.fiat = selectedCurrency;
            fiatBtn.querySelector(".selected").textContent = selectedCurrency;
            fiatBtn.className.replace(/^shown$/, '');
            populateFiatList(fiat);

            ohlc.getData(selectedCoin, selectedCurrency, "update");

        }
    };
    const getCurrentPrice = (currency) => {
        const url = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${currency}&tsyms=${selectedCurrency},BTC`;
        fetch(url)
        .then(response => response.json())
        .then(data => {
            updateInfoSection(data);
            updateDashboard(data);
            updateCryptoNav();
        })
        .catch(console.error);
    };
    getCurrentPrice(selectedCoin);
    populateFiatList(fiat);
    populateCryptoNav();
    ohlc.getData(selectedCoin, selectedCurrency, "init", "update");
    setInterval(() => {
       getCurrentPrice(selectedCoin);
       ohlc.getData(selectedCoin, selectedCurrency, "update");
    }, 8000);
    suggestionsList.addEventListener("click", selectFromSearch);
    searchInput.addEventListener("change", displayMatches);
    searchInput.addEventListener("keyup", displayMatches);
    fiatBtn.addEventListener("click", toggleFiatList)
    fiatList.addEventListener("click", changeSelectedFiat);
};
const getCurrencyData = (response, currency) => {
    const formatNumbers = (number, fix, d = ".", divider = ",", s = "") => {
        fix = isNaN(fix = Math.abs(fix)) ? 2 : fix;
        const sign = number < 0 ? "-" : s;
        const int = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(fix)));
        var first = (first = int.length) > 3 ? first % 3 : 0;
        return `${sign}${(first ? int.substr(0, first) + divider : "")}${int.substr(first).replace(/(\d{3})(?=\d)/g, "$1" + divider)}${(fix ? d + Math.abs(number - int).toFixed(fix).slice(2) : "")}`;
    };
    const prices = response.RAW[currency][selectedCurrency];
    const info = processed.filter(item => item.symbol === currency)[0];
    return {
        rank: info.rank,
        name: info.name,
        symbol: info.symbol,
        proof: info.proof,
        img: info.imgUrl,
        algorithm: info.algorithm,
        marketCap: formatNumbers(prices.MKTCAP, 0, ".", " "),
        price: formatNumbers(prices.PRICE, 2, ".", " "),
        priceBTC: response.RAW[currency].BTC.FROMSYMBOL === response.RAW[currency].BTC.TOSYMBOL ? "1.00" : formatNumbers(response.RAW[currency].BTC.PRICE, 8, '.', ' '),
        volume24: formatNumbers(prices.TOTALVOLUME24HTO, 0, ".", " "),
        supply: formatNumbers(prices.SUPPLY, 0, ".", ","),
        maxSupply: formatNumbers(parseFloat(info.maxSupply), 0, ".", ","),
        percentBTC: response.RAW[currency].BTC.FROMSYMBOL === response.RAW[currency].BTC.TOSYMBOL ? "0.00" : formatNumbers(response.RAW[currency].BTC.CHANGEPCT24HOUR, 2, ".", " ", "+"),
        percent: formatNumbers(prices.CHANGEPCT24HOUR, 2, ".", " ", "+")
    }
};
const updateDashboard = (response) => {
    const data = getCurrencyData(response, selectedCoin);
    const DOM = {
        name: document.querySelector(".dashboard__currency-name__name"),
        symbol: document.querySelector(".dashboard__currency-name__symbol"),
        icon: document.querySelector(".dashboard__currency-name__icon")
    }
    DOM.name.textContent = data.name;
    DOM.symbol.textContent = `(${data.symbol})`;
    DOM.icon.src = data.img;
}
const updateInfoSection = (response) => {
    const data = getCurrencyData(response, selectedCoin);
    const DOM = {
        percent: document.querySelector("#percent-24"),
        percentBTC: document.querySelector("#percent-btc"),
        price: document.querySelector("#usd-price"),
        priceBtc: document.querySelector("#btc-price"),
        marketCap: document.querySelector("#market-cap"),
        volume24: document.querySelector("#volume-24"),
        supply: document.querySelector("#supply"),
        maxSupply: document.querySelector("#max-supply"),
        algorithm: document.querySelector("#algorithm"),
        proof: document.querySelector("#proof")
    }
    const populateFields = () => {
        DOM.price.innerHTML = `${getFiatSymbol()} ${data.price}`;
        DOM.priceBtc.innerHTML = `${data.priceBTC} BTC`;
        DOM.marketCap.innerHTML = `${getFiatSymbol()} ${data.marketCap}`;
        DOM.volume24.innerHTML = `${getFiatSymbol()} ${data.volume24}`;
        DOM.supply.textContent = `${data.supply} ${data.symbol}`;
        DOM.percent.textContent = `${data.percent}%`;
        DOM.percentBTC.innerHTML = ` (${data.percentBTC}%)`;
        DOM.maxSupply.textContent = `${data.maxSupply} ${data.symbol}`;
        DOM.algorithm.textContent = data.algorithm;
        DOM.proof.textContent = data.proof;
    };
    const handlePercentState = (...list) => {
        list.forEach(cur => {
            if (data[cur] >= 0) {
                DOM[cur].classList.add("up");
                DOM[cur].classList.remove("down");
            } else {
                DOM[cur].classList.add("down");
                DOM[cur].classList.remove("up");
            }
        });
    };
    const handleInfoExistence = (...list) => {
        list.forEach(cur => {
            if (data[cur] != 0 && data[cur] != "N/A") {
                DOM[cur].parentNode.style.display = "";
            } else {
                DOM[cur].parentNode.style.display = "none";
            }
        });
    };
    populateFields();
    handlePercentState("percent", "percentBTC");
    handleInfoExistence("marketCap", "volume24", "maxSupply", "algorithm", "proof", "supply");
};
const updateCryptoNav = () => {
    document.querySelectorAll(".currency").forEach(cur => {
        const url = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${cur.dataset.currency}&tsyms=${selectedCurrency},BTC`;
        fetch(url)
            .then(response => response.json())
            .then(response => {
                const data = getCurrencyData(response, cur.dataset.currency);
                if (data) {
                    cur.querySelector(".price").innerHTML = `${getFiatSymbol()} ${data.price}`;
                    cur.querySelector(".name").textContent = data.name;
                    cur.querySelector(".symb").textContent = data.symbol;
                    cur.querySelector(".currency__coin-icon").src = data.img;
                    cur.querySelector(".percentage").innerHTML = `${data.percent}%`;
                    if (data.percent >= 0) {
                        cur.classList.add("up");
                        cur.classList.remove("down");
                    } else {
                        cur.classList.add("down");
                        cur.classList.remove("up");
                    }
                }
            }).catch(console.error);
    });
};
const getFiatSymbol = () => fiat.filter(cur => cur.name === selectedCurrency)[0].symbol;
init();


// let timeRange = "24h";
document.querySelectorAll(".dashboard__button").forEach(cur => cur.addEventListener("click", () => {
    ohlc.range = cur.dataset.time;
    ohlc.getData(selectedCoin, selectedCurrency, "update");
    document.querySelectorAll(".dashboard__button").forEach(cur => cur.classList.remove("active"));
    cur.classList.add("active");
}));
