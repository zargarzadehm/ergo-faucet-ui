import React, { useEffect } from "react";
import "./App.css";
import { useState } from "react";
import axios from "axios";
import { useInterval } from "./hooks/useInterval";
import ReCAPTCHA from "react-google-recaptcha";
import Logo from './ErgoFaucetV2.svg';
const BaseUrl = "/"
const getErgUrl = BaseUrl + "getAsset";
const supportedTokenUrl = BaseUrl + "supportedAssets"
const infoUrl = BaseUrl + "info"
const waitError = "please wait and try later";

function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [captchaData, setCaptchaData] = useState(null);
    const [trxUrl, setTrxUrl] = useState(false);
    const [address, setAddress] = useState("");
    const [token, setToken] = useState(null);
    const [error, setError] = useState("");
    const [supportedAsset, setSupportedAsset] = useState({});
    const [info, setInfo] = useState({});

    const loadSupportedAsset = () => {
        axios.get(supportedTokenUrl).then(response => {
            const tokens = response.data
            setSupportedAsset(tokens)
            if (token === null && tokens) {
                setToken(Object.keys(tokens)[0])
            }
        })
    }
    const loadInfo = () => {
        axios.get(infoUrl).then(response => {
            setInfo(response.data)
            document.title = response.data.title ? response.data.title: document.title;
        })
    }
    useEffect(() => {
        loadSupportedAsset()
        loadInfo()
    }, [])
    const request = () => {
        if (!address) {
            setError("Type address");
            setIsLoading(false)
            return;
        }

        if (!captchaData) {
            setError("Captcha first!");
            setIsLoading(false)
            return;
        }

        axios
            .post(getErgUrl, {address: address, challenge: captchaData, assetId: token})
            .then(({data}) => {
                if (data.message === waitError && data.success === false) {
                    return;
                }
                setTrxUrl(data.txId);
                setIsLoading(false);
            })
            .catch((err) => {
                if (err.response?.data?.message) {
                    setError(err.response?.data?.message);
                    setIsLoading(false);
                }
            });
    };

    useInterval(() => {
        if (isLoading) {
            request();
        }
    }, 60 * 1000);

    useInterval(() => {
        loadSupportedAsset()
    }, 1000 * 10)

    function handleClick() {
        setIsLoading(true);
        request();
    }

    function onChange(val) {
        setCaptchaData(val);
    }

    const btnTitle = info ? info.mainButton : ""
    return (
        <div className="container">
            <ul className="navbar">
                {info.buttons ? info.buttons.map((description, index) => (
                    <li key={index} className={description.active ? "active" : ""}>
                        {description.active ? description.name : (
                            <a className="nav-item" href={description.url}>
                                {description.name}
                            </a>
                        )}
                    </li>
                )) : null}
            </ul>
            <img src={Logo} alt="React Logo" className="header-logo"/>
            <div className="main-input-container">
                <label className="main-input-label">
                    Enter wallet address
                    <input
                        className={`main-input ${error && "error"}`}
                        value={address}
                        disabled={isLoading}
                        onChange={({target}) => {
                            setError("");
                            setAddress(target.value);
                        }}
                        type="text"
                    />
                </label>
            </div>
            <div className="main-input-container">
                <label className="main-input-label">
                    Select asset
                    <select className="main-input" value={token} onChange={event => setToken(event.target.value)}>
                        {Object.entries(supportedAsset).map(([key, value], index) => (
                            <option key={index} value={key}>{value}</option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="marginHorizontal">
                {info.siteKey ? (
                    <ReCAPTCHA sitekey={info.siteKey} theme="dark" onChange={onChange}/>
                ) : null}
            </div>
            <div className="main-button-container">
                <button className="main-button" onClick={handleClick} disabled={!captchaData || isLoading}>
                    {isLoading ? (
                        <span className="loading"/>
                    ) : btnTitle}
                </button>
            </div>
            {error && <div className="error">{error}</div>}
            {isLoading && (
                <div className="message">
                    Please wait, you will receive your Erg soon. Do not close the page.
                    (May take 10-15 minutes)
                </div>
            )}
            {!isLoading && trxUrl && (
                <div className="message">
                    Erg successfully received.{" "}
                    <a
                        className="main-link"
                        href={trxUrl}
                        target="_blank"
                        rel="noreferrer"
                    >
                        View transaction on explorer
                    </a>
                </div>
            )}
        </div>
    );
}

export default App;
