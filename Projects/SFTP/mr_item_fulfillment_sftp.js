/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(["N/search", "N/file", "N/record", "N/sftp"], function (
  search,
  file,
  record,
  sftp
) {
  //This should be an array of objects aimed at reducing the no of saved search queries required to get data for updating the records

  function getInputData() {
    var transactionSearch = search.load({
      id: "8043",
    });

    return transactionSearch;
  }

  function map(context) {
    var searchResult = JSON.parse(context.value);
    // log.debug("searchResult : ", searchResult);

    var inboundObject = {
      "Customer ID": "MCB",
      "ORDER TYPE": "ECOM",
      BATCH: searchResult.values.internalid.value,
      "Order ID": searchResult.values.custbody_grouped_order_id,
      "3rd Party PO": "",
      "SHIPPING CODE":
        searchResult.values.custbody_3pl_utah_ship_appliedcode.text,
      "Shipping Method": searchResult.values.shipmethod.text,
      "Ship Company": searchResult.values.shipaddressee,
      ShipEmail: searchResult.values["email.customer"],
      "Ship Phone Number": searchResult.values["phone.customer"],
      "Ship Address 1": searchResult.values.shipaddress1,
      "Ship Address 2": searchResult.values.shipaddress2,
      "Ship City": searchResult.values.shipcity,
      "Ship State/Province": searchResult.values.shipstate,
      "Ship PostalCode": searchResult.values.shipzip,
      "Ship Country": searchResult.values.shipcountry.value,
      "Product Part Number": searchResult.values["externalid.item"].text,
      Description: searchResult.values["displayname.item"],
      "Product Quantity": searchResult.values.quantity,
      "Tracking Number": "",
      Amount: searchResult.values.amount,
      Shipping: "",
    };

    context.write({
      key: inboundObject["Customer ID"],
      value: inboundObject,
    });
  }

  function reduce(context) {
    var inboundData = context.values;
    // log.debug("inboundData : " , JSON.parse(inboundData));

    var totalInboundRecords = [];
    let orderIdRecords = new Map();

    if (inboundData.length > 0) {
      for (var i = 0; i < inboundData.length; i++) {

        // totalInboundRecords.push(JSON.parse(inboundData[i]));
        var orderId = JSON.parse(inboundData[i])["Order ID"];
        var insideLoop = true
        if (orderIdRecords.size != 0) {
          orderIdRecords.forEach((value, key) => {
            if (insideLoop) {
              if (key == orderId) {

                orderIdRecords.set(orderId, value + String(i))
                insideLoop = false
              } else {

                orderIdRecords.set(orderId, String(i))
                insideLoop = false
              }
            }
          })
        } else {

          orderIdRecords.set(orderId, String(i))
        }

      }
    }
    orderIdRecords.forEach((value, key) => {
      let tempArray = []
      if (value.length > 1) {
        for (var i = 0; i < value.length; i++) {
          tempArray.push(JSON.parse(inboundData[parseInt(value.charAt(i))]))
        }
        totalInboundRecords.push(tempArray)
      } else {
        totalInboundRecords.push(JSON.parse(inboundData[parseInt(value.charAt(i))]))
      }
    })
    log.debug("totalInboundRecords : ", totalInboundRecords);

    //got all the data in a JSON array. Now push those to the inbound file

    try {
      var todaysDate = formatDate(new Date());
      var fileName = "inbound_" + todaysDate + ".txt";
      var fileRequest = {
        name: fileName,
        fileType: file.Type.PLAINTEXT,
        contents: JSON.stringify(totalInboundRecords),
        description: "Inbound file for MCB Elite Upload",
        folder: 682537, //MCB Elite > inbound_files folder internal id
      };

      var generatedFile = file.create(fileRequest);

      var fileId = generatedFile.save();
      log.debug("File Generated :: ", fileId);

      try {
        var connection = createSftpConnection();
        connection.upload({
          directory: "inb/",
          filename: fileName,
          file: generatedFile,
          replaceExisting: true,
        });

        log.debug("File Uploaded :: " + fileName);
        //after file uploaded, move the file in file cabinet to processed folder

        var fileObj = file.load({
          id: fileId,
        });
        fileObj.folder = 682541; //folder id for processed folder
        var newFileId = fileObj.save();

        for (var i = 0; i < inboundData.length; i++) {
          var internalId = JSON.parse(inboundData[i]).BATCH;
          record.submitFields({
            type: "itemfulfillment",
            id: internalId,
            values: {
              custbody_integrated_status: "1",
            },
          });

          log.debug("itemfulfillmentRecordId saved : ", internalId);
        }

        log.debug("New file Id :: " + newFileId);
      } catch (ex) {
        log.debug("File Upload Error :: ", ex);
      }
    } catch (e) {
      log.debug("File Creation Error :: ", e);
    }
  }

  function createSftpConnection() {
    //password guid: dac4544b6d24425d852cfc2dc86c0813
    var passwordGUID = "81dc859ac4b643ab9a304a959578b039";
    var myhostKey =
      "AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBFkULWjadRhIE5ZOfjhKe7yq4BufNCh2PpAuUAeiuPwz5zuqJc13+dbd7U63AGjX/QwrrjNiAL242lJuUGXdJ+4=";

    try {
      var connection = sftp.createConnection({
        url: "96.82.147.249",
        port: 22,
        hostKey: myhostKey,
        hostKeyType: "rsa",
        username: "SFTPuser",
        passwordGuid: passwordGUID,
        directory: "/C:/SFTP_Root/TEST/",
      });
      log.debug("Connection established!");
    } catch (e) {
      log.debug("Error : ", e);
    }

    return connection;
  }

  function padTo2Digits(num) {
    return num.toString().padStart(2, "0");
  }

  function formatDate(date) {
    return [
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
      date.getFullYear(),
    ].join("");
  }

  return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
  };
});