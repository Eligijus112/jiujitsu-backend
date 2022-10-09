// Defining a response that will be sent when the user is not authorized
const errorResponse = (res) => {
    res.status(401).json(
        {   
            status_code: 401, 
            message: "Unauthorized" 
        }
    );
}