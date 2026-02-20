import axios from "axios";

const API = axios.create({
    // baseURL: "http://localhost:5000/api",

    baseURL: "https://lionfish-app-pk8s6.ondigitalocean.app/api",
});
export const getAllUsers = (params) => {
    return API.get("/user", { params });
};

export const deleteUser = (id) => {
    return API.delete(`/users/${id}`);
};