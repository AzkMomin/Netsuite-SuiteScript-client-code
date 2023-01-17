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
    //saved search which lists out the invoices where delta dollars are used
    const itemfulfillmentSearchColInternalId = search.createColumn({
      name: "internalid",
    });
    const itemfulfillmentSearchColIntegratedStatus = search.createColumn({
      name: "custbody_integrated_status",
    });
    const itemfulfillmentSearchColDocumentNumber = search.createColumn({
      name: "tranid",
      join: "createdFrom",
    });
    const itemfulfillmentSearchColFormulaTextXMLH8LNX = search.createColumn({
      name: "formulatext",
      formula: "{createdfrom.tranid}",
    });
    const itemfulfillmentSearch = search.create({
      type: "itemfulfillment",
      filters: [
        ["mainline", "is", "T"],
        "AND",
        ["type", "anyof", "ItemShip"],
        "AND",
        ["custbody_integrated_status", "anyof", ["1", "2", "3"]],
      ],
      columns: [
        itemfulfillmentSearchColInternalId,
        itemfulfillmentSearchColIntegratedStatus,
        itemfulfillmentSearchColDocumentNumber,
        itemfulfillmentSearchColFormulaTextXMLH8LNX,
      ],
    });
    return itemfulfillmentSearch;
  }

  function map(context) {
    var searchResult = JSON.parse(context.value);
    log.debug("searchResult : ", searchResult);

    //we need to pass the entire result set to reduce so we hard code the value of key for every resultset
    context.write({
      key: 1,
      value: searchResult,
    });
  }

  function reduce() {
    var connection = createSftpConnection();

    //read the ack folder and outbound folder to process their data
    var ackFiles = connection.list({
      path: "ack",
    });

    log.debug("Files Present in ack folder : ", ackFiles.length);
    log.debug("Files present :: ", JSON.stringify(ackFiles));

    processAckFiles(ackFiles, connection);

    var outboundFiles = connection.list({
      path: "outb",
    });

    log.debug("Files Present in outbound folder : ", outboundFiles.length);
    log.debug("Files present :: ", JSON.stringify(outboundFiles));

    processOutboundFiles(outboundFiles, connection);
  }

  function processAckFiles(files, connection) {
    if (files.length > 0) {
      for (var i = 0; i < files.length; i++) {
        if (files[i].directory == false) {
          //process only files
          var fileName = files[i].name;
          var downloadedFile = getDownloadedFile(connection, "ack/" + fileName);

          if (downloadedFile !== false) {
            //process ack files here
            var fileContents = downloadedFile.getContents();
            var ackObject = JSON.parse(fileContents);
            log.debug(
              "Ack file Contents of " + fileName,
              JSON.stringify(ackObject)
            );

            ackObject.forEach((result) => {
              var objectCount = Object.keys(result).length;
              if (objectCount > 0) {
                for (key in result) {
                  var docNo = result.DocNum;
                  if (key == "DocNum") {
                    //SO-MCB-42297-1234
                    var docNoArray = docNo.split("-");

                    try {
                      if (result.AcceptedDate !== "") {
                        var itemfulfillmentRecordId = record.submitFields({
                          type: "itemfulfillment",
                          id: docNoArray[3],
                          values: {
                            custbody_accepted_date: result.AcceptedDate,
                            custbody_integrated_status: "2",
                          },
                        });
                        log.debug(
                          "itemfulfillmentRecordId saved : ",
                          itemfulfillmentRecordId
                        );
                      } else if (result.RejectedDate !== "") {
                        var itemfulfillmentRecordId = record.submitFields({
                          type: "itemfulfillment",
                          id: docNoArray[3],
                          values: {
                            custbody_accepted_date: result.RejectedDate,
                            custbody_rejected_reason: result.RejectReason,
                            custbody_integrated_status: "3",
                          },
                        });
                        log.debug(
                          "itemfulfillmentRecordId saved : ",
                          itemfulfillmentRecordId
                        );
                      }
                    } catch (exp) {
                      log.debug(
                        "Item fulfillment record does not exist :: ",
                        docNoArray[3]
                      );
                    }
                  }
                }
              }
            });

            try {
              // file processed, now move it to another directory
              connection.move({
                from: "ack/" + fileName,
                to: "proc/" + fileName,
              });
              log.debug("File moved successfully :: " + fileName);
            } catch (e) {
              log.debug("Failed to move file to proc :: " + fileName);
            }
          }
        }
      }
    }
  }

  function processOutboundFiles(files, connection) {
    if (files.length > 0) {
      log.debug("file length : ", files.length);
      for (var i = 0; i < files.length; i++) {
        if (files[i].directory == false) {
          //process only files
          var fileName = files[i].name;
          var downloadedFile = getDownloadedFile(
            connection,
            "outb/" + fileName
          );

          if (downloadedFile !== false) {
            //process ack files here
            var fileContents = downloadedFile.getContents();
            var outboundObject = JSON.parse(fileContents);
            log.debug(
              "Outbound file Contents of " + fileName,
              JSON.stringify(outboundObject)
            );

            outboundObject.forEach((result) => {
              var objectCount = Object.keys(result).length;
              if (objectCount > 0) {
                for (key in result) {
                  var docNo = result.DocNum;
                  var shippedDate = result.ShippedDate;
                  var trackingNo = result.TrackingNo;
                  if (key == "DocNum") {
                    //SO-MCB-42297-1234
                    var docNoArray = docNo.split("-");

                    try {
                      var itemfulfillmentRecordId = record.submitFields({
                        type: "itemfulfillment",
                        id: docNoArray[3],
                        values: {
                          custbody_integrated_status: "4",
                        },
                      });

                      var itemFulfillmentRec = record.load({
                        type: "itemfulfillment",
                        id: docNoArray[3],
                      });

                      itemFulfillmentRec.setValue({
                        fieldId: "shipstatus",
                        value: "C",
                      });

                      itemFulfillmentRec.setValue({
                        fieldId: "shippeddate",
                        value: new Date(shippedDate),
                      });

                      var itemWeight = itemFulfillmentRec.getValue({
                        fieldId: "custbody_bol_fullfilment_weight",
                      });

                      itemFulfillmentRec.setSublistValue({
                        sublistId: "package",
                        fieldId: "packagetrackingnumber",
                        line: 0,
                        value: trackingNo,
                      });

                      itemFulfillmentRec.setSublistValue({
                        sublistId: "package",
                        fieldId: "packageweight",
                        line: 0,
                        value: itemWeight, //For the timeBeing it hard coded to 5 ,else it will set itemWeight
                      });

                      itemFulfillmentRec.save();

                      log.debug(
                        "itemfulfillmentRecordId saved : ",
                        itemfulfillmentRecordId
                      );
                    } catch (exp) {
                      log.debug("Item fulfillment record Error :: ", exp);
                    }
                  }
                }
              }
            });
            try {
              // file processed, now move it to another directory
              connection.move({
                from: "outb/" + fileName,
                to: "proc/" + fileName,
              });
              log.debug("File moved successfully :: " + fileName);
            } catch (e) {
              log.debug("Failed to move file to proc :: " + fileName);
            }
          }
        }
      }
    }
  }

  function createSftpConnection() {
    var passwordGUID = "47e73bc8e7b6467487efc8c6ba568137";
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

  function getDownloadedFile(connection, fileName) {
    try {
      var downloadedFile = connection.download({
        filename: fileName,
      });
      return downloadedFile;
    } catch (e) {
      log.debug("Unable to download file :: ", e);
      return false;
    }
  }

  function saveDownloadFileToSpecificFolder(content, fileType) {
    var todaysDate = formatDate(new Date());
    var folderId = "";
    switch (fileType) {
      case "outbound":
        folderId = 682541;
        break;
      default:
        folderId = 682541;
        break;
    }
    var fileRequest = {
      name: fileType + "_" + todaysDate + ".txt",
      fileType: file.Type.PLAINTEXT,
      contents: JSON.stringify(content),
      description: fileType + " file for MCB Elite Upload",
      folder: folderId, //MCB Elite > fileType_files folder internal id
    };

    var generatedFile = file.create(fileRequest);

    var fileId = generatedFile.save();
    log.debug("File Generated :: ", fileId);
  }

  return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
  };
});
