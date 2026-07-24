import axios from "axios";
import FormData from "form-data";

const API_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("=== STARTING SECURITY AND DATA ISOLATION TESTS ===");
  
  const timestamp = Date.now();
  const johnEmail = `john_${timestamp}@cleartax.com`;
  const payalEmail = `payal_${timestamp}@cleartax.com`;
  const password = "Password123!";

  let johnToken = "";
  let johnUser = null;
  let payalToken = "";
  let payalUser = null;

  // 1. Sign up John
  try {
    const signupJohnRes = await axios.post(`${API_URL}/auth/signup`, {
      name: "John",
      email: johnEmail,
      password: password
    });
    console.log("✔ John signup successful");
  } catch (error) {
    console.error("❌ John signup failed:", error.response?.data || error.message);
    process.exit(1);
  }

  // 2. Sign up Payal
  try {
    await axios.post(`${API_URL}/auth/signup`, {
      name: "Payal",
      email: payalEmail,
      password: password
    });
    console.log("✔ Payal signup successful");
  } catch (error) {
    console.error("❌ Payal signup failed:", error.response?.data || error.message);
    process.exit(1);
  }

  // 3. Login as John
  try {
    const loginJohnRes = await axios.post(`${API_URL}/auth/login`, {
      email: johnEmail,
      password: password
    });
    johnToken = loginJohnRes.data.token;
    johnUser = loginJohnRes.data.user;
    console.log("✔ John login successful");
  } catch (error) {
    console.error("❌ John login failed:", error.response?.data || error.message);
    process.exit(1);
  }

  // 4. Login as Payal
  try {
    const loginPayalRes = await axios.post(`${API_URL}/auth/login`, {
      email: payalEmail,
      password: password
    });
    payalToken = loginPayalRes.data.token;
    payalUser = loginPayalRes.data.user;
    console.log("✔ Payal login successful");
  } catch (error) {
    console.error("❌ Payal login failed:", error.response?.data || error.message);
    process.exit(1);
  }

  // 5. John uploads a CSV file
  let johnBatchId = null;
  try {
    const form = new FormData();
    const csvContent = "Invoice Number,Vendor,Amount\nINV-001,Globex,500.00\nINV-002,Acme,300.00";
    form.append("file", Buffer.from(csvContent), {
      filename: "john_invoices.csv",
      contentType: "text/csv"
    });

    const uploadJohnRes = await axios.post(`${API_URL}/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${johnToken}`
      }
    });
    johnBatchId = uploadJohnRes.data.data.batch.id;
    console.log(`✔ John uploaded a CSV file (Batch ID: ${johnBatchId})`);
  } catch (error) {
    console.error("❌ John upload failed:", error.response?.data || error.message);
    process.exit(1);
  }

  // Allow a small delay for worker initialization if any
  await new Promise(resolve => setTimeout(resolve, 500));

  // 6. John lists uploads (expect 1)
  try {
    const johnUploadsRes = await axios.get(`${API_URL}/uploads`, {
      headers: { Authorization: `Bearer ${johnToken}` }
    });
    const uploads = johnUploadsRes.data.data;
    if (uploads.length === 1 && uploads[0].id === johnBatchId) {
      console.log("✔ John retrieved ONLY his uploads (1 batch)");
    } else {
      console.error("❌ John retrieved unexpected uploads list:", uploads);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ John listing uploads failed:", error.response?.data || error.message);
    process.exit(1);
  }

  // 7. Payal lists uploads (expect 0)
  try {
    const payalUploadsRes = await axios.get(`${API_URL}/uploads`, {
      headers: { Authorization: `Bearer ${payalToken}` }
    });
    const uploads = payalUploadsRes.data.data;
    if (uploads.length === 0) {
      console.log("✔ Payal retrieved ONLY her uploads (0 batches)");
    } else {
      console.error("❌ Payal retrieved John's uploads or unexpected batches:", uploads);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Payal listing uploads failed:", error.response?.data || error.message);
    process.exit(1);
  }

  // 8. Payal attempts to access John's UploadBatch details by ID (expect 403 Forbidden)
  try {
    await axios.get(`${API_URL}/uploads/${johnBatchId}`, {
      headers: { Authorization: `Bearer ${payalToken}` }
    });
    console.error("❌ BOLA Security Failure: Payal successfully accessed John's batch details!");
    process.exit(1);
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log("✔ Scenario 2: Payal is BLOCKED from accessing John's batch (403 Forbidden)");
    } else {
      console.error(`❌ Payal access John's batch returned unexpected status: ${error.response?.status || error.message}`);
      process.exit(1);
    }
  }

  // 9. Payal attempts to retry John's UploadBatch (expect 403 Forbidden)
  try {
    await axios.post(`${API_URL}/uploads/${johnBatchId}/retry`, {}, {
      headers: { Authorization: `Bearer ${payalToken}` }
    });
    console.error("❌ BOLA Security Failure: Payal successfully triggered retry for John's batch!");
    process.exit(1);
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log("✔ Scenario 2 (Retry): Payal is BLOCKED from triggering John's batch retry (403 Forbidden)");
    } else {
      console.error(`❌ Payal retry John's batch returned unexpected status: ${error.response?.status || error.message}`);
      process.exit(1);
    }
  }

  // 10. Payal attempts to access John's Invoices (expect 0 invoices due to data isolation filter)
  try {
    const payalInvoicesRes = await axios.get(`${API_URL}/invoices?uploadBatchId=${johnBatchId}`, {
      headers: { Authorization: `Bearer ${payalToken}` }
    });
    const invoices = payalInvoicesRes.data.data;
    if (invoices.length === 0) {
      console.log("✔ Scenario 3: Payal is BLOCKED from seeing John's invoices (0 returned due to isolation)");
    } else {
      console.error("❌ BOLA Security Failure: Payal successfully retrieved John's invoices!", invoices);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Payal querying invoices failed:", error.response?.data || error.message);
    process.exit(1);
  }

  // 11. Remove JWT / Access without token (expect 401 Unauthorized)
  try {
    await axios.get(`${API_URL}/uploads`);
    console.error("❌ Authentication Failure: Successfully retrieved uploads without JWT!");
    process.exit(1);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log("✔ Scenario 4: Request without JWT blocked (401 Unauthorized)");
    } else {
      console.error(`❌ Request without JWT returned unexpected status: ${error.response?.status || error.message}`);
      process.exit(1);
    }
  }

  // 12. Expired / Invalid JWT (expect 401 Unauthorized)
  try {
    await axios.get(`${API_URL}/uploads`, {
      headers: { Authorization: "Bearer this_is_an_invalid_jwt_token_string" }
    });
    console.error("❌ Authentication Failure: Successfully retrieved uploads with invalid JWT!");
    process.exit(1);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log("✔ Scenario 5: Request with invalid/expired JWT blocked (401 Unauthorized)");
    } else {
      console.error(`❌ Request with invalid JWT returned unexpected status: ${error.response?.status || error.message}`);
      process.exit(1);
    }
  }

  console.log("\n🎉 ALL SECURITY AUDIT SCENARIOS PASSED SUCCESSFULLY!");
  process.exit(0);
}

runTests();
