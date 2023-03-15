var inboundData = [
    {
        "Customer ID": "MCB",
        "ORDER TYPE": "ECOM",
        BATCH: "8374390",
        "Order ID": "2301311357020111",
        "3rd Party PO": "",
        "Shipping Method": "UPS Ground (AV)",
        "Ship Company": "Variedades En Estilo LLC",
        ShipEmail: "VariedadesEnEstilo@gmail.com",
        "Ship Phone Number": "(571) 464-2091 JOSE (SON)",
        "Ship Address 1": "8452 Centreville Road",
        "Ship Address 2": "",
        "Ship City": "Manassas",
        "Ship State/Province": "VA",
        "Ship PostalCode": "20111",
        "Ship Country": "US",
        "Product Part Number": "PR12263-Y07-26",
        Description: "PRINCESA",
        "Product Quantity": "1",
        "Tracking Number": "",
        Amount: ".00",
        Shipping: ""
    },
    {
        "Customer ID": "MCB",
        "ORDER TYPE": "ECOM",
        BATCH: "8374388",
        "Order ID": "2301311083895670",
        "3rd Party PO": "",
        "SHIPPING CODE": "008",
        "Shipping Method": "UPS Standard (AV)",
        "Ship Company": "Boutique Moroleon",
        ShipEmail: "boutiquemoroleon@gmail.com",
        "Ship Phone Number": "(916) 366-0106",
        "Ship Address 1": "2901 Mather Field Rd",
        "Ship Address 2": "",
        "Ship City": "Rancho Cordova",
        "Ship State/Province": "CA",
        "Ship PostalCode": "95670",
        "Ship Country": "US",
        "Product Part Number": "PR12261-343-8",
        Description: "PRINCESA",
        "Product Quantity": "1",
        "Tracking Number": "",
        Amount: ".00",
        Shipping: ""
    },

    {
        "Customer ID": "MCB",
        "ORDER TYPE": "ECOM",
        BATCH: "8374391",
        "Order ID": "2301311357020111",
        "3rd Party PO": "",
        "Shipping Method": "UPS Ground (AV)",
        "Ship Company": "Variedades En Estilo LLC",
        ShipEmail: "VariedadesEnEstilo@gmail.com",
        "Ship Phone Number": "(571) 464-2091 JOSE (SON)",
        "Ship Address 1": "8452 Centreville Road",
        "Ship Address 2": "",
        "Ship City": "Manassas",
        "Ship State/Province": "VA",
        "Ship PostalCode": "20111",
        "Ship Country": "US",
        "Product Part Number": "PR12263-Y07-6",
        Description: "PRINCESA",
        "Product Quantity": "1",
        "Tracking Number": "",
        Amount: ".00",
        Shipping: ""
    },
    {
        "Customer ID": "MCB",
        "ORDER TYPE": "ECOM",
        BATCH: "8374392",
        "Order ID": "2301311357020111",
        "3rd Party PO": "",
        "Shipping Method": "UPS Ground (AV)",
        "Ship Company": "Variedades En Estilo LLC",
        ShipEmail: "VariedadesEnEstilo@gmail.com",
        "Ship Phone Number": "(571) 464-2091 JOSE (SON)",
        "Ship Address 1": "8452 Centreville Road",
        "Ship Address 2": "",
        "Ship City": "Manassas",
        "Ship State/Province": "VA",
        "Ship PostalCode": "20111",
        "Ship Country": "US",
        "Product Part Number": "PR12263-Y07-4",
        Description: "PRINCESA",
        "Product Quantity": "1",
        "Tracking Number": "",
        Amount: ".00",
        Shipping: ""
    },
    {
        "Customer ID": "MCB",
        "ORDER TYPE": "ECOM",
        BATCH: "8374389",
        "Order ID": "2301311368679104",
        "3rd Party PO": "",
        "Shipping Method": "UPS Ground (AV)",
        "Ship Company": "La Tapatia",
        ShipEmail: "Silvia65munoz@gmail.com",
        "Ship Phone Number": "(806) 371-7030",
        "Ship Address 1": "1205 S Grand",
        "Ship Address 2": "",
        "Ship City": "Amarillo",
        "Ship State/Province": "TX",
        "Ship PostalCode": "79104",
        "Ship Country": "US",
        "Product Part Number": "PR30087-478-10",
        Description: "PRINCESA - ROYAL/GOLD",
        "Product Quantity": "1",
        "Tracking Number": "",
        Amount: ".00",
        Shipping: ""
    },
]

var totalInboundRecords = [];
let orderIdRecords = [];

if (inboundData.length > 0) {
    for (var i = 0; i < inboundData.length; i++) {
        // totalInboundRecords.push(JSON.parse(inboundData[i]));
        var orderId = inboundData[i]["Order ID"];
        //console.log("orderId : ", orderId);
        var objectCount = Object.keys(inboundData[i]).length;
        
            var notFound = true
            if (orderIdRecords.length > 0) {
                for (var j = 0; j < orderIdRecords.length; j++) {
                    //console.log("orderIdRecords[j].key : ", orderIdRecords[j].key);
                    if (parseInt(orderIdRecords[j].key) == parseInt(orderId)) {

                        orderIdRecords[j].value = (orderIdRecords[j].value).concat(String(i))
                        notFound = false
                    }
                }
                if (notFound) {
                    orderIdRecords.push({
                        key: orderId,
                        value: String(i)
                    })
                }

            } else {
                orderIdRecords.push({
                    key: orderId,
                    value: String(i)
                })
            }
        
    }
}
console.log("orderIdRecords : ", orderIdRecords);
for (var j = 0; j < orderIdRecords.length; j++) {
    let tempArray = []
    console.log("Length : " + (orderIdRecords[j].value).length)
    if ((orderIdRecords[j].value).length > 1) {
        for (var i = 0; i < (orderIdRecords[j].value).length; i++) {

            // console.log(parseInt(String(orderIdRecords[j].value).charAt(i)));
            tempArray.push(inboundData[parseInt(String(orderIdRecords[j].value).charAt(i))])
        }
        totalInboundRecords.push(tempArray)
    } else {
        // console.log(parseInt(String(orderIdRecords[j].value)));
        totalInboundRecords.push((inboundData[parseInt(String(orderIdRecords[j].value))]))
    }
}
console.log("totalInboundRecords : ", totalInboundRecords);