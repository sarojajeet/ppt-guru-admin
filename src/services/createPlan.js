import axios from "axios";

// const API_URL = "http://localhost:5000/api/plan";
const API_URL = "https://lionfish-app-pk8s6.ondigitalocean.app/api/plan";
export const getPlans = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const createPlan = async (planData) => {
    const response = await axios.post(`${API_URL}/create`, planData);
    return response.data;
};

export const updatePlan = async (id, data) => {
    const response = await axios.put(`${API_URL}/update/${id}`, data);
    return response.data;
};