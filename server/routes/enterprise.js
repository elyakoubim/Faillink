import express from "express";
import axios from "axios";
import crypto from "crypto";
import https from "https";

const router = express.Router();

// The secret API key (should be stored securely in .env in production)
const SECRET_API_KEY = "G75tSbiroK0gda3tgeGOtLZ03O";

// Helper function to convert keys to camelCase
const toCamelCase = (string) => {
  return string.replace(/[-_\s.]+(.)?/g, (_, chr) =>
    chr ? chr.toUpperCase() : ""
  );
};

// Helper function to recursively convert object keys to camelCase
const arrayMapRecursiveKeys = (obj, callback) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => arrayMapRecursiveKeys(item, callback));
  }

  if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = typeof key === "string" ? callback(key) : key;
      newObj[newKey] = arrayMapRecursiveKeys(value, callback);
    }
    return newObj;
  }

  return obj;
};

// Generate WS-Security elements for SOAP request
const generateWSSecurity = (username, password) => {
  const nonceBytes = crypto.randomBytes(16);
  const nonce = nonceBytes.toString("base64");
  const created = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const expires = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");

  const passwordDigest = crypto
    .createHash("sha1")
    .update(
      Buffer.concat([nonceBytes, Buffer.from(created), Buffer.from(password)])
    )
    .digest("base64");

  const usernameTokenId =
    "UsernameToken-" + crypto.randomBytes(16).toString("hex").toUpperCase();
  const timestampId =
    "TS-" + crypto.randomBytes(16).toString("hex").toUpperCase();

  return {
    nonce,
    created,
    expires,
    passwordDigest,
    usernameTokenId,
    timestampId,
  };
};

// Build SOAP request
const buildSoapRequest = (entrepriseNumber, langue, wsSecurity) => {
  const {
    nonce,
    created,
    expires,
    passwordDigest,
    usernameTokenId,
    timestampId,
  } = wsSecurity;

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:dat="http://economie.fgov.be/kbopub/webservices/v1/datamodel" xmlns:mes="http://economie.fgov.be/kbopub/webservices/v1/messages" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
   <soapenv:Header>
      <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" soapenv:mustUnderstand="1">
         <wsse:UsernameToken wsu:Id="${usernameTokenId}">
            <wsse:Username>wsot3703</wsse:Username>
            <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${passwordDigest}</wsse:Password>
            <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonce}</wsse:Nonce>
            <wsu:Created>${created}</wsu:Created>
         </wsse:UsernameToken>
         <wsu:Timestamp wsu:Id="${timestampId}">
            <wsu:Created>${created}</wsu:Created>
            <wsu:Expires>${expires}</wsu:Expires>
         </wsu:Timestamp>
      </wsse:Security>
      <mes:RequestContext>
         <mes:Id>Test-1</mes:Id>
         <mes:Language>${langue}</mes:Language>
      </mes:RequestContext>
   </soapenv:Header>
   <soapenv:Body>
      <mes:ReadEnterpriseRequest>
         <dat:EnterpriseNumber>${entrepriseNumber}</dat:EnterpriseNumber>
      </mes:ReadEnterpriseRequest>
   </soapenv:Body>
</soapenv:Envelope>`;
};

// Parse XML response
const parseXmlResponse = (response) => {
  // Force to UTF-8 in case it isn't
  const utf8Response = Buffer.from(response, "utf8").toString("utf8");

  // Extract enterprise data using more robust regex patterns
  const data = {};

  // Extract enterprise number
  const numberMatch = utf8Response.match(/<ns2:Number>([^<]+)<\/ns2:Number>/);
  if (numberMatch) data.enterpriseNumber = numberMatch[1];

  // Extract denomination (company name)
  const denominationMatch = utf8Response.match(
    /<ns2:Denomination[^>]*>[\s\S]*?<ns2:Value>([^<]+)<\/ns2:Value>/
  );
  if (denominationMatch) data.enterpriseName = denominationMatch[1];

  // Extract juridical situation
  const juridicalMatch = utf8Response.match(
    /<ns2:JuridicalSituation[^>]*>[\s\S]*?<ns2:Description[^>]*>[\s\S]*?<ns2:Value>([^<]+)<\/ns2:Value>/
  );
  if (juridicalMatch) data.juridicalSituation = juridicalMatch[1];

  // Extract juridical form
  const formMatch = utf8Response.match(
    /<ns2:JuridicalForm[^>]*>[\s\S]*?<ns2:Description[^>]*>[\s\S]*?<ns2:Value>([^<]+)<\/ns2:Value>/
  );
  if (formMatch) data.juridicalForm = formMatch[1];

  // Extract capital with currency
  const capitalAmountMatch = utf8Response.match(
    /<ns2:Capital[^>]*>[\s\S]*?<ns2:Amount>([^<]+)<\/ns2:Amount>/
  );
  const capitalCurrencyMatch = utf8Response.match(
    /<ns2:Capital[^>]*>[\s\S]*?<ns2:Currency>([^<]+)<\/ns2:Currency>/
  );
  if (capitalAmountMatch) {
    data.capital = {
      amount: capitalAmountMatch[1],
      currency: capitalCurrencyMatch ? capitalCurrencyMatch[1] : null,
    };
  }

  // Extract type of enterprise
  const typeMatch = utf8Response.match(
    /<ns2:TypeOfEnterprise>([^<]+)<\/ns2:TypeOfEnterprise>/
  );
  if (typeMatch) data.typeOfEnterprise = typeMatch[1];

  // Extract address
  const streetMatch = utf8Response.match(
    /<ns2:Address[^>]*>[\s\S]*?<ns2:Street[^>]*>[\s\S]*?<ns2:Value>([^<]+)<\/ns2:Value>/
  );
  const houseNumberMatch = utf8Response.match(
    /<ns2:HouseNumber>([^<]+)<\/ns2:HouseNumber>/
  );
  const zipcodeMatch = utf8Response.match(
    /<ns2:Zipcode>([^<]+)<\/ns2:Zipcode>/
  );
  const municipalityMatch = utf8Response.match(
    /<ns2:Municipality[^>]*>[\s\S]*?<ns2:Value>([^<]+)<\/ns2:Value>/
  );
  const addressBeginMatch = utf8Response.match(
    /<ns2:Address[^>]*>[\s\S]*?<ns2:Begin>([^<]+)<\/ns2:Begin>/
  );
  const addressTypeMatch = utf8Response.match(
    /<ns2:Address[^>]*>[\s\S]*?<ns2:TypeOfAddress[^>]*>[\s\S]*?<ns2:Value>([^<]+)<\/ns2:Value>/
  );

  if (streetMatch || houseNumberMatch || zipcodeMatch || municipalityMatch) {
    data.address = {
      street: streetMatch ? streetMatch[1] : null,
      houseNumber: houseNumberMatch ? houseNumberMatch[1] : null,
      zipcode: zipcodeMatch ? zipcodeMatch[1] : null,
      municipality: municipalityMatch ? municipalityMatch[1] : null,
      beginDate: addressBeginMatch ? addressBeginMatch[1] : null,
      type: addressTypeMatch ? addressTypeMatch[1] : null,
    };
  }

  // Extract qualifications
  const qualifications = [];
  const qualificationMatches = utf8Response.matchAll(
    /<ns2:Qualification[^>]*>[\s\S]*?<ns2:Code>([^<]+)<\/ns2:Code>[\s\S]*?<ns2:Description[^>]*>[\s\S]*?<ns2:Value>([^<]+)<\/ns2:Value>[\s\S]*?<ns2:Period[^>]*>[\s\S]*?<ns2:Begin>([^<]+)<\/ns2:Begin>/g
  );

  for (const match of qualificationMatches) {
    qualifications.push({
      code: match[1],
      description: match[2],
      beginDate: match[3],
    });
  }

  if (qualifications.length > 0) {
    data.qualifications = qualifications;
  }

  // Extract activities with more detail
  const activities = [];
  const activityMatches = utf8Response.matchAll(
    /<ns2:Activity[^>]*>[\s\S]*?<ns2:Code>([^<]+)<\/ns2:Code>[\s\S]*?<ns2:Description[^>]*>[\s\S]*?<ns2:Value>([^<]+)<\/ns2:Value>[\s\S]*?<ns2:Period[^>]*>[\s\S]*?<ns2:Begin>([^<]+)<\/ns2:Begin>/g
  );

  for (const match of activityMatches) {
    activities.push({
      code: match[1],
      description: match[2],
      beginDate: match[3],
    });
  }

  if (activities.length > 0) {
    data.activities = activities;
  }

  // Extract functions (people) with more detail
  const functions = [];
  const functionMatches = utf8Response.matchAll(
    /<ns2:Function[^>]*>[\s\S]*?<ns2:Code>([^<]+)<\/ns2:Code>[\s\S]*?<ns2:Description[^>]*>[\s\S]*?<ns2:Value>([^<]+)<\/ns2:Value>[\s\S]*?<ns2:Period[^>]*>[\s\S]*?<ns2:Begin>([^<]+)<\/ns2:Begin>[\s\S]*?<ns2:Person[^>]*>[\s\S]*?<ns2:Surname>([^<]+)<\/ns2:Surname>[\s\S]*?<ns2:GivenName>([^<]+)<\/ns2:GivenName>/g
  );

  for (const match of functionMatches) {
    functions.push({
      code: match[1],
      function: match[2],
      beginDate: match[3],
      surname: match[4],
      givenName: match[5],
    });
  }

  if (functions.length > 0) {
    data.functions = functions;
  }

  // Extract linked enterprises
  const linkedEnterprises = [];
  const linkedMatches = utf8Response.matchAll(
    /<ns2:LinkedEnterprise[^>]*>[\s\S]*?<ns2:Code>([^<]+)<\/ns2:Code>[\s\S]*?<ns2:Description[^>]*>[\s\S]*?<ns2:Value>([^<]+)<\/ns2:Value>[\s\S]*?<ns2:EnterpriseNumberSubject>([^<]+)<\/ns2:EnterpriseNumberSubject>[\s\S]*?<ns2:EnterpriseNumberObject>([^<]+)<\/ns2:EnterpriseNumberObject>[\s\S]*?<ns2:Period[^>]*>[\s\S]*?<ns2:Begin>([^<]+)<\/ns2:Begin>/g
  );

  for (const match of linkedMatches) {
    linkedEnterprises.push({
      code: match[1],
      description: match[2],
      enterpriseNumberSubject: match[3],
      enterpriseNumberObject: match[4],
      beginDate: match[5],
    });
  }

  if (linkedEnterprises.length > 0) {
    data.linkedEnterprises = linkedEnterprises;
  }

  // Extract financial data
  const financialData = {};
  const annualMeetingMonthMatch = utf8Response.match(
    /<ns2:AnnualMeetingMonth>([^<]+)<\/ns2:AnnualMeetingMonth>/
  );
  const fiscalYearEndDayMatch = utf8Response.match(
    /<ns2:FiscalYearEndDay>([^<]+)<\/ns2:FiscalYearEndDay>/
  );
  const fiscalYearEndMonthMatch = utf8Response.match(
    /<ns2:FiscalYearEndMonth>([^<]+)<\/ns2:FiscalYearEndMonth>/
  );
  const financialBeginMatch = utf8Response.match(
    /<ns2:FinancialData[^>]*>[\s\S]*?<ns2:ValidityPeriod[^>]*>[\s\S]*?<ns2:Begin>([^<]+)<\/ns2:Begin>/
  );

  if (
    annualMeetingMonthMatch ||
    fiscalYearEndDayMatch ||
    fiscalYearEndMonthMatch
  ) {
    financialData.annualMeetingMonth = annualMeetingMonthMatch
      ? annualMeetingMonthMatch[1]
      : null;
    financialData.fiscalYearEndDay = fiscalYearEndDayMatch
      ? fiscalYearEndDayMatch[1]
      : null;
    financialData.fiscalYearEndMonth = fiscalYearEndMonthMatch
      ? fiscalYearEndMonthMatch[1]
      : null;
    financialData.beginDate = financialBeginMatch
      ? financialBeginMatch[1]
      : null;
    data.financialData = financialData;
  }

  // Extract period information
  const periodMatch = utf8Response.match(
    /<ns2:Period[^>]*>[\s\S]*?<ns2:Begin>([^<]+)<\/ns2:Begin>/
  );
  if (periodMatch) data.establishmentDate = periodMatch[1];

  // Extract business units count
  const businessUnitsMatch = utf8Response.match(
    /<ns2:BusinessUnits>([^<]+)<\/ns2:BusinessUnits>/
  );
  if (businessUnitsMatch) data.businessUnits = businessUnitsMatch[1];

  // Extract status information
  const statusMatch = utf8Response.match(
    /<ns2:Status[^>]*>[\s\S]*?<ns2:Code>([^<]+)<\/ns2:Code>[\s\S]*?<ns2:Description[^>]*>[\s\S]*?<ns2:Value>([^<]+)<\/ns2:Value>/
  );
  if (statusMatch) {
    data.status = {
      code: statusMatch[1],
      description: statusMatch[2],
    };
  }

  return data;
};

// Enterprise read endpoint
router.get("/read", async (req, res) => {
  try {
    // API Key check (uncomment if needed)
    // const apiKey = req.headers['api-key'];
    // if (apiKey !== SECRET_API_KEY) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    // Validate required parameters
    const { lang, enterprise_number } = req.query;

    if (!enterprise_number) {
      return res
        .status(400)
        .json({ error: "Missing required parameter: enterprise_number" });
    }

    const langue = lang || "fr"; // Default language

    const username = "wsot3703";
    const password = "mFM7rJe95nCN48gsDTJMqurq";
    const serviceUrl =
      "https://kbopub-acc.economie.fgov.be/kbopubws110000/services/wsKBOPub";

    // Generate WS-Security elements
    const wsSecurity = generateWSSecurity(username, password);

    // Build SOAP request
    const soapRequest = buildSoapRequest(enterprise_number, langue, wsSecurity);

    console.log(
      "About to make SOAP call with enterprise number:",
      enterprise_number
    );
    console.log("SOAP Request to send:", soapRequest);

    // Send the request using axios
    const response = await axios.post(serviceUrl, soapRequest, {
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
        SOAPAction: "http://fgov.economie.be/kbopub/ReadEnterprise",
      },
      timeout: 30000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    console.log("HTTP Response Code:", response.status);
    console.log("SOAP Response received:", response.data);

    if (response.status !== 200) {
      throw new Error(`HTTP request failed with status ${response.status}`);
    }

    // Parse the XML response
    const data = parseXmlResponse(response.data);

    // Normalize keys to camelCase
    const normalizedData = arrayMapRecursiveKeys(data, toCamelCase);

    res.json(normalizedData);
  } catch (error) {
    console.error("Error in readEnterprise:", error.message);
    res.status(500).json({
      error: "Enterprise lookup failed",
      details: error.message,
    });
  }
});

export default router;
