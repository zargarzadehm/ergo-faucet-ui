import React from "react";
import "./App.css";
import { useState } from "react";
import axios from "axios";
import { useInterval } from "./hooks/useInterval";
import ReCAPTCHA from "react-google-recaptcha";

const baseApi = "/getErg";
const waitError = "please wait and try later";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [captchaData, setCaptchaData] = useState(null);
  const [trxUrl, setTrxUrl] = useState(false);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const request = () => {
    if (!address) {
      setError("Type address");
      return;
    }

    if (!captchaData) {
      setError("Captcha first!");
      return;
    }

    axios
      .post(baseApi, { address, challenge: captchaData })
      .then(({ data }) => {
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

  function handleClick() {
    setIsLoading(true);
    request();
  }

  function onChange(val) {
    setCaptchaData(val);
  }

  return (
    <div className="container">
      <div className="main-input-container">
        <label className="main-input-label">
          Enter wallet address
          <input
            className={`main-input ${error && "error"}`}
            value={address}
            disabled={isLoading}
            onChange={({ target }) => {
              setError("");
              setAddress(target.value);
            }}
            type="text"
          />
        </label>
      </div>
      <div>
        <ReCAPTCHA
            sitekey="6Lec6wMcAAAAAGyzEtT9Sx76iStGz_vk_gd70qvo"
            theme="dark"
            onChange={onChange}
        />
      </div>
      <div className="main-button-container">
        <button
          className="main-button"
          onClick={handleClick}
          disabled={!captchaData || isLoading}
        >
          {isLoading ? (
            <span className="loading">
              <span />
              <span />
            </span>
          ) : (
            "Get Erg On TestNet"
          )}
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
