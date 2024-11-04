const axios = require('axios');


async function generateAccessTocken(){
const response = await axios({
   url: "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    method: 'post',
    data: 'grant_type=client_credentials',
    auth: {
        username: 'AWBJAQpHjgvEHpN4y3k3YVbXSrR2NKgr4phaQDemZuhbzaHg80-7VWt0x-YIbft7z6x9_TBVeQFDqZgV',
        password: 'ELnW_mxuEui9aV5sJ0yvL7DHCoMXyfQEj1U01fLxs68NLBA_fEv1LrOjz4BrhwzlHg_qDMHHlUsbDgPz'
    }
})

return response.data.access_token;

}

exports.createOrder = async () => {
    const accessToken = await generateAccessTocken();
    const response = await axios({
        url: 'https://api-m.sandbox.paypal.com/v2/checkout/orders',
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        data: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [ { 
                items: [{
                    name: 'Node Js code',
                    description: 'node js',
                    quantity: 1,
                    unit_amount: { "currency_code": "USD", "value": "100.00" } } ], 

                
               amount: { 
                currency_code: "USD",
                 value: "100.00",
                breakdown: {
                    item_total: {
                        currency_code: "USD",
                        value: "100.00"
                    }
                  

                } } 

            }],

            application_context: {
                return_url: 'http://localhost:3000/order_complete',
                cancel_url: 'http://localhost:3000/order_cancel',
                user_action: 'PAY_NOW',
                brand_name: 'demo supermarket',
            }
                
        })
    })

   return response.data.links.find(link => link.rel === 'approve').href
}

exports.capturePayment = async (orderId) => {
    const accessToken = await generateAccessTocken()

    const response = await axios({
        url: `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },

    })

    return response.data
}




