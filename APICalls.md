import axios from "axios"

<!-- "http://localhost:3001/contracts/2" My headers "profile_id: 1" -->

const fetch = async () => {

    try {
        const headers = {
            "profile_id": 1
        };

        const res = await axios.get("http://localhost:3001/contracts/2", { headers });
        console.log(res.data); 
    } catch (error) {
        console.error("Error fetching data:", error);
    }

}

<!-- "http://localhost:3001/contracts" My headers "profile_id: 4" -->

const fetch = async () => {

    try {
        const headers = {
            "profile_id": 4
        };

        const res = await axios.get("http://localhost:3001/contracts", { headers });
        console.log(res.data);
    } catch (error) {
        console.error("Error fetching data:", error);
    }

}

<!-- MY URL "http://localhost:3001/jobs/unpaid" My headers "profile_id: 7" -->

const fetch = async () => {

    try {
        const headers = {
            "profile_id": 7
        };

        const res = await axios.get("http://localhost:3001/jobs/unpaid", { headers });
        console.log(res.data);
    } catch (error) {
        console.error("Error fetching data:", error);
    }

}


<!-- MY URL "http://localhost:3001/jobs/1/pay" My headers "profile_id: 1" -->
const fetch = async () => {

    try {
        const headers = {
            "profile_id": 1
        };

        const res = await axios.post("http://localhost:3001/jobs/1/pay", { headers });
        console.log(res.data);
    } catch (error) {
        console.error("Error fetching data:", error);
    }

}

<!-- MY URL "http://localhost:3001/balances/deposit" My headers "profile_id: 2" -->
const fetch = async () => {

    try {
        const headers = {
            "profile_id": 2
        };

        const formData = {
            amount: 10
        }

        const res = await axios.post("http://localhost:3001/balances/deposit", formData, { headers });
        console.log(res.data);
    } catch (error) {
        console.error("Error fetching data:", error);
    }

}


<!-- MY URL "http://localhost:3001/admin/best-profession?start=2024-05-07 &end=2024-06-08 -->
const fetch = async () => {

    try {
        const res = await axios.get("http://localhost:3001/admin/best-profession?start=2024-05-07&end=2024-06-08");
        console.log(res.data);
    } catch (error) {
        console.error("Error fetching data:", error);
    }

}


<!-- MY URL "http://localhost:3001/admin/best-clients?start=2020-08-15 &end=2024-06-08 -->
const fetch = async () => {

    try {
        const res = await axios.get("http://localhost:3001/admin/best-clients?start=2020-08-15&end=2024-06-08);
        console.log(res.data);
    } catch (error) {
        console.error("Error fetching data:", error);
    }

}