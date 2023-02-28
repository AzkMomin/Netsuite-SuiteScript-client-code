/*

Sirus Badiee
Streamforce Solutions
February 1, 2021

This scheduled script processes the custom SFS | Opportunity and SFS | Opportunity Line records into Subscriptions or Subscription Change Orders. Here's the mapping:

Salesforce Opportunity              >       NetSuite SFS | Opportunity              >       NetSuite Subscription
Salesforce Opportunity Products     >       NetSuite SFS | Opportunity Lines        >       NetSuite Subscription

If "New Business" Opportunity is identified, this script does the following:
    Creates the NetSuite Subscription Record
    Loops through the SFS | Opportunity Lines
    Creates a CSV file that captures all of the Subscription Line information
    Uploads the CSV file to add the Subscription lines using a saved CSV mapping
    Sets the Start Date based on the SFS | Opportunity record, which comes from Salesforce
    
If "Upsell", "Product Churn", or "Amendment" Opportunity is identified, this script does the following:
    Loads the existing NetSuite Subscription record (integration brings over existing Subscription from Salesforce)
    Loops through the Subscription Lines and identifies the existing items
    If new items that existed on the SFS | Opportunity, but not on the existing NetSuite Subscription are identified:
        Creates a CSV file that captures all of the Subscription Line information
        Uploads the CSV file to add the Subscription lines using a saved CSV mapping
    If items exist on both SFS | Opportunity and on the existing NetSuite Subscription are identified:
        Loop through the existing NetSuite Subscription Lines to capture the current quantity (to determine the final quantity on the Subscription)
        Creates a Subscription Change Order to capture the final quantity and the price changes

If "Full Product Churn" Opportunity is identified, this script does the following:
    Creates a Change Order - Terminate for that specific Product on the Opportunity Start Date, based on the Opportunity record

If "Full Churn" Opportunity is identified, this script does the following:
    Creates a Change Order - Terminate for all currently active Subscription lines

If "Replacement" Opportunity is identified, this script does the following:
    Creates a CSV file for the Opportunity Lines, but with the Subscription Line Type of "One Time"
    Adds to existing Subscription

Notes:
    Because Subscription Lines are not scriptable as of 2021.1, we had to go the route of creating a CSV file and loading it via saved CSV mapping

*/

var tollMgmtID = 246;                                       // Internal ID for "Toll Management" Item
var tollChargesID = 456;                                    // Internal ID for "Toll Charges Incurred" Item
var connectedCarServRepID = 421;                            // Internal ID for "Connected Car Services Replacement" Item
var ccdHarnessID = 346;                                     // Internal ID for "CCD Harness" Item
var subPlanID = 442;                                        // Default subscription plan internal ID
var csvFolder = 9415;                                       // Folder to create CSV file
var newBusID = '1';                                         // Custom list "SFS | Opportunity Type" internal ID for New Business
var upsellID = '2';                                         // Custom list "SFS | Opportunity Type" internal ID for Upsell
var churnID = '3';                                          // Custom list "SFS | Opportunity Type" internal ID for Churn
var amendID = '6';                                          // Custom list "SFS | Opportunity Type" internal ID for Amendment
var replID = '7';                                           // Custom list "SFS | Opportunity Type" internal ID for Replacement
var addLinesCSVMapID = 'custimport_sfs_sc_add_lines_to_sub';  // Saved CSV Mapping to add the Subscription Lines

var SEARCH_PAGE_SIZE = 1000;
var USAGE_LIMIT = 100;
var RECORD_MOD, SEARCH_MOD, RUNTIME_MOD, TASK_MOD, EMAIL_MOD, RENDER_MOD, FILE_MOD;

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */


define(['N/record', 'N/runtime', 'N/search', 'N/task', 'N/email', 'N/file'], runScheduledScript);

function runScheduledScript(record, runtime, search, task, email, file) {
    RECORD_MOD = record;
    SEARCH_MOD = search;
    RUNTIME_MOD = runtime;
    TASK_MOD = task;
    EMAIL_MOD = email;
    FILE_MOD = file;
    return { execute: execute }
}

function execute(context) {
    try {
        processOpportunities()
    }
    catch (e) {
        log.error('ERROR', e.toString());
    }
    return;
}

// This first function runs a search and checks what is the Opportunity Type and calls separate functions, depending on the Type

function processOpportunities() {
    var mySearch = SEARCH_MOD.load({ id: 'customsearch_sc_sfs_opps_to_process' }); // Here is the execution of the search

    var pagedData = mySearch.runPaged({ pageSize: SEARCH_PAGE_SIZE });

    var pageRangeLength = pagedData.pageRanges.length;

    // Loop through each page that was returned from the search
    for (var p = 0; p < pageRangeLength; p++) {
        var page = pagedData.fetch({ index: p });
        var data = page.data;
        var dataLength = data.length;

        // Loop through records to get fields
        for (var r = 0; r < dataLength; r++) {
            var recData = data[r];
            var oppID = recData.getValue({ name: 'internalid' })
            var oppType = recData.getValue({ name: "custrecord_sc_sfs_opp_type" });
            var churnType = recData.getValue({ name: "custrecord_sc_sfs_opp_churn_type" });
            var recID = recData.getValue({ name: "internalid" });
            var subID = recData.getValue({ name: "custrecord_sc_sfs_opp_ns_sub_id" });
            var oppName = recData.getValue({ name: "custrecord_sc_sfs_opp_name" });


            var oppCustObj = translateOpp(recID); // This function creates/returns an object that includes all of the relevant data from the Opportunity

            if (oppType === newBusID) {
                log.debug('new business');
                try {
                    newSubscription(oppCustObj) // New Business
                }
                catch (e) {
                    updateErrorMessage(oppID, e.message)
                    log.error('ERROR', e.toString());

                }
            }

            if (oppType === upsellID || oppType === amendID || (oppType === churnID && churnType === 'Product Churn')) // Upsell, Amendment or Product Churn
            {
                log.debug('upsell or product churn');
                try {
                    updateSubscription(subID, oppCustObj);
                }
                catch (e) {
                    updateErrorMessage(oppID, e.message)
                    log.error('ERROR', e.toString());
                }
            }

            if (oppType === churnID && churnType === 'Full Churn') // Full Churn
            {
                log.debug('full churn');
                try {
                    terminateSubscription(subID, oppCustObj);
                }
                catch (e) {
                    updateErrorMessage(oppID, e.message)
                    log.error('ERROR', e.toString());
                }
            }

            if (oppType === churnID && churnType === 'Full Product Churn') // Full Product
            {
                log.debug('full product churn');
                try {
                    terminateSubscriptionLine(subID, oppCustObj);
                }
                catch (e) {
                    updateErrorMessage(oppID, e.message)
                    log.error('ERROR', e.toString());
                }
            }

            if (oppType === replID) // Replacement
            {
                log.debug('replacement');
                try {
                    addReplacement(subID, oppCustObj);
                }
                catch (e) {
                    updateErrorMessage(oppID, e.message)
                    log.error('ERROR', e.toString());
                }
            }
        }
    }

}

function updateErrorMessage(oppID, message) {
    if (message.length > 299) {
        message = message.substring(0, 299)
    }
    RECORD_MOD.submitFields({
        type: 'customrecord_sc_sfs_opportunity',
        id: oppID,
        values: {
            'custrecord_sc_sfs_script_error': message
        },
        options: {
            enableSourcing: false,
            ignoreMandatoryFields: true
        }
    });
}

function addReplacement(subID, oppObj) {
    try {
        addItems(subID, oppObj.items, oppObj.currency);

        RECORD_MOD.submitFields({
            type: 'customrecord_sc_sfs_opportunity',
            id: oppObj.id,
            values: {
                'custrecord_sc_sfs_opp_ns_rec_created': true
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true
            }
        });
    }
    catch (e) {
        var errMsg;
        errMsg = e.name + '\n' + e.message;
        log.error('system error', errMsg);
    }


}

function translateOpp(recID) {
    // Following code loads the custom record SFS | Opportunity and loops through the item-level fields to set as an array as the itemLines attribute on the object

    var oppObj = RECORD_MOD.load({
        type: 'customrecord_sc_sfs_opportunity',
        id: recID,
        isDynamic: false
    });

    // Getting fields from the record to store on the object to be returned at the end of this function
    var oppName = oppObj.getValue({ fieldId: "custrecord_sc_sfs_opp_name" });
    var startDate = oppObj.getValue({ fieldId: "custrecord_sc_sfs_opp_start_date" });
    var billAct = Number(oppObj.getValue({ fieldId: "custrecord_sc_sfs_opp_bill_act_id" }));
    var custID = Number(oppObj.getValue({ fieldId: "custrecord_sc_sfs_opp_cust_id" }));
    var currency = oppObj.getValue({ fieldId: "custrecord_sc_sfs_opp_currency" });
    var type = oppObj.getValue({ fieldId: "custrecord_sc_sfs_opp_type" });
    var oppRecID = oppObj.getValue({ fieldId: "id" });

    log.debug('oppName', oppName)
    var shortenedName = ''
    var oppNameLength = Number(oppName.length)
    log.debug('oppNameLength', oppNameLength)


    if (oppName.indexOf('Redcap Integration') != -1) {
        log.debug('contains redcap')

        shortenedName = oppName.substring(21, oppNameLength)
    }
    else if (oppNameLength > 39) {
        log.debug('does not contain redcap - over 50')
        shortenedName = oppName.substring(0, 39)

    }
    else {
        log.debug('no redcap, no over 50')
        shortenedName = oppName
    }

    log.debug('oppName', oppName)

    oppName = shortenedName

    log.debug('oppName', oppName)

    var itemLines = [];

    // Loop through lines on the SFS Opportunity object
    var numLines = oppObj.getLineCount({ sublistId: 'recmachcustrecord_sc_sfs_opp_line_par_opp' });
    for (var m = 0; m < numLines; m++) {
        var lineItemID = Number(oppObj.getSublistValue({
            sublistId: 'recmachcustrecord_sc_sfs_opp_line_par_opp',
            fieldId: 'custrecord_sc_sfs_opp_line_item_id',
            line: m
        }));

        var lineItemQty = Number(oppObj.getSublistValue({
            sublistId: 'recmachcustrecord_sc_sfs_opp_line_par_opp',
            fieldId: 'custrecord_sc_sfs_opp_line_qty',
            line: m
        }));

        var lineItemRate = Number(oppObj.getSublistValue({
            sublistId: 'recmachcustrecord_sc_sfs_opp_line_par_opp',
            fieldId: 'custrecord_sc_sfs_opp_line_rate',
            line: m
        }));

        // The following code is specifically to ensure the discount is able to calculated (though it's returned as a string) and successfully put on the to-be-created Subscription Line

        var lineItemDisc = ""; // Creates a variable with an empty string

        lineItemDisc = oppObj.getSublistValue({
            sublistId: 'recmachcustrecord_sc_sfs_opp_line_par_opp',
            fieldId: 'custrecord_sc_sfs_opp_line_disc',
            line: m
        }); // Sets this variable to the Discount percentage

        // Following code checks to see that the lineItemDisc variable actually has a value
        // If it has a value, then it adds the "%" to the string

        if (lineItemDisc !== "" || lineItemDisc !== null || lineItemDisc !== undefined || lineItemDisc !== 0) {
            lineItemDisc += "%"; // Adding a "%" to the variable to ensure that it's able to be processed on the Subscription Line
        }

        // Following code checks to see if there is no value on the Opportunity (from Salesforce, if there is no discount, this value just returns a "%")
        // If the lineItemDisc is just a "%", this sets the lineItemDisc just sets to an empty string
        if (lineItemDisc === "%") {
            lineItemDisc = "";
        }

        // Creates a lineObj with all of the item line attributes
        // Note that the +2 to the line is to ensure that the to-be-created Subscription Lines are created correctly 
        //      This is because the Subscription "line numbers" start at 1 and the second line of every Subscription is from the Subscription Plan which adds a "Dealerware Placeholder Item"
        //      Note that this placeholder item is NOT included in any Subscription, but we still need to account for it in the code to ensure that the Subscription Lines are added after this placeholder item
        var lineObj =
        {
            line: (m + 2),
            itemid: lineItemID,
            quantity: lineItemQty,
            rate: lineItemRate,
            discount: lineItemDisc,
            date: startDate
        };

        itemLines[m] = lineObj;
    }

    // Creates a "Subscription Object" to be able to processed into a new or updated Subscription
    var subObj =
    {
        id: oppRecID,
        name: oppName,
        startDate: startDate,
        billAct: billAct,
        custID: custID,
        currency: currency,
        type: type,
        items: itemLines
    }

    return subObj;

}

function newSubscription(oppObj) {
    // This is for new Subscriptions only and creates a new Subscription based on the values from the custom object SFS | Opportunity

    var newSub = RECORD_MOD.create({ type: RECORD_MOD.Type.SUBSCRIPTION });

    newSub.setValue({
        fieldId: 'customer',
        value: oppObj.custID,
        ignoreFieldChange: true
    });

    var today = new Date();
    var dd = String(today.getDate());
    var mm = String(today.getMonth() + 1); //January is 0!
    var yyyy = today.getFullYear();
    var yearString = String(yyyy)
    var shortenedYear = yearString.substring(2, 4)

    today = mm + '/' + dd + '/' + shortenedYear;

    var newSubName = oppObj.name + ' ' + today

    newSub.setValue({
        fieldId: 'name',
        value: newSubName,
        ignoreFieldChange: true
    });

    /* Commenting out due to issues being caused by Subscriptions with the same name
  
        newSub.setValue({
        fieldId: 'name',
        value: oppObj.name,
        ignoreFieldChange: true
    });

    */
    newSub.setValue({
        fieldId: 'billingaccount',
        value: oppObj.billAct,
        ignoreFieldChange: true
    });

    newSub.setValue({
        fieldId: 'subscriptionplan',
        value: Number(subPlanID),
        ignoreFieldChange: true
    });

    newSub.setValue({
        fieldId: 'startdate',
        value: oppObj.startDate,
        ignoreFieldChange: true
    });

    var newSubID = newSub.save();

    log.debug('new sub created', newSubID);

    // Following code sets the Subscription ID and the "Processed" to true on the custom record

    RECORD_MOD.submitFields({
        type: 'customrecord_sc_sfs_opportunity',
        id: oppObj.id,
        values: {
            'custrecord_sc_sfs_opp_ns_sub_id': newSubID,
            'custrecord_sc_sfs_opp_ns_rec_created': true
        },
        options: {
            enableSourcing: false,
            ignoreMandatoryFields: true
        }
    });

    // Add the Subscription Lines
    try {
        addItems(newSubID, oppObj.items, oppObj.currency)
    }
    catch (e) {
        var errMsg;
        errMsg = e.name + '\n' + e.message;
        log.error('system error', errMsg);
    }

    return newSubID;

}

function addItems(subID, itemArr, currencyID) {


    // Adds a line to the item array - if Toll Management is used, the Toll Charges Incurred item is added automatically at the end of the array
    for (var i = 0; i < itemArr.length; i++) {
        if (itemArr[i].itemid === tollMgmtID) {
            itemArr.push({
                itemid: tollChargesID,
                quantity: '',
                rate: 1,
                discount: '',
                date: itemArr[i].date
            });
        }

    }


    var subLines = 0;

    log.debug('adding items to sub ID ' + subID, itemArr);

    // Following code gets the highest line number of the current Subscription

    var subscriptionlineSearchObj = SEARCH_MOD.create({
        type: "subscriptionline",
        filters:
            [
                ["subscription.internalidnumber", "equalto", Number(subID)]
            ],
        columns:
            [
                SEARCH_MOD.createColumn({
                    name: "linenumber",
                    summary: "MAX"
                })
            ]
    });
    var searchResultCount = subscriptionlineSearchObj.runPaged().count;
    subscriptionlineSearchObj.run().each(function (result) {
        // .run().each has a limit of 4,000 results
        subLines = Number(result.getValue({ name: "linenumber", summary: "MAX" }))
        return true;
    });

    // Create CSV file to be loaded and add the Subscription Lines

    var csvFile = FILE_MOD.create({
        name: 'Adding Subscription Lines.csv',
        contents: '',
        folder: csvFolder,
        fileType: FILE_MOD.Type.CSV,
        isOnline: true
    });

    csvFile.appendLine({ value: 'Internal ID,Start Date,Line Number,Item,Quantity,Discount,Price Plan,Billing Mode,Line Type,Charge Frequency,Repeat Every' });

    for (var i = 0; i < itemArr.length; i++) {
        var lineNum = Number(subLines + 1); // This is where we add 1 to the highest line number of the current Subscription - ensuring that the line items are added
        var lineItem = itemArr[i].itemid;
        var lineQty = itemArr[i].quantity;
        var lineRate = itemArr[i].rate;
        var lineDisc = itemArr[i].discount;
        var rawLineDate = itemArr[i].date;
        var lineDate = (rawLineDate.getMonth() + 1) + '/' + rawLineDate.getDate() + '/' + rawLineDate.getFullYear();
        var pricePlanID = createPricePlan(lineRate, currencyID);

        // If the "Toll Charges" item is used, the Subscription Line needs to have the type of "Usage"
        if (Number(lineItem) === Number(tollChargesID)) {
            csvFile.appendLine({ value: subID + ',' + lineDate + ',' + lineNum + ',' + lineItem + ',' + lineQty + ',' + lineDisc + ',' + pricePlanID + ',In Arrears,Usage,Monthly,1' });
        }

        // If the "Connected Car Services Replacement" item or the "CCD Harness" item is used, the Subscription Line needs to have the type of "One Time"
        else if (Number(lineItem) === Number(connectedCarServRepID) || Number(lineItem) === Number(ccdHarnessID)) {
            csvFile.appendLine({ value: subID + ',' + lineDate + ',' + lineNum + ',' + lineItem + ',' + lineQty + ',' + lineDisc + ',' + pricePlanID + ',In Arrears,One Time,One Time,' });
        }

        // If the "Toll Charges" item is NOT used and "Connected Car Services Replacement" item is NOT used, the Subscription Line needs to have the type of "Usage"
        else {
            csvFile.appendLine({ value: subID + ',' + lineDate + ',' + lineNum + ',' + lineItem + ',' + lineQty + ',' + lineDisc + ',' + pricePlanID + ',In Arrears,Usage,Monthly,1' });
        }
        subLines++;
    }

    var csvFileId = csvFile.save();
    log.debug('csvFileId , ' , csvFileId);

    // Load the CSV into NetSuite using saved CSV mapping
    var scriptTask = TASK_MOD.create({ taskType: TASK_MOD.TaskType.CSV_IMPORT });
    scriptTask.name = 'Adding Line Items to Subscription';
    scriptTask.mappingId = addLinesCSVMapID;
    var csvLoad = FILE_MOD.load(csvFileId);
    scriptTask.importFile = csvLoad;

    try {
        var csvImportTaskId = scriptTask.submit();
    }
    catch (e) {
        var errMsg;
        errMsg = e.name + '\n' + e.message;
        log.error('system error', errMsg);
    }

}

function createPricePlan(lineRate, currencyID) {
    // This function creates the Price Plan record for any new item adds and Subscription Change Orders

    var pricePlanRec = RECORD_MOD.create({
        type: RECORD_MOD.Type.PRICE_PLAN,
        isDynamic: true
    });

    pricePlanRec.setValue({
        fieldId: 'currency',
        value: currencyID
    });

    pricePlanRec.setValue({
        fieldId: 'priceplantype',
        value: 2
    });

    pricePlanRec.selectLine({
        sublistId: 'pricetiers',
        line: 0
    });

    pricePlanRec.setCurrentSublistValue({
        sublistId: 'pricetiers',
        fieldId: 'pricingoption',
        value: '-101'
    });

    pricePlanRec.setCurrentSublistValue({
        sublistId: 'pricetiers',
        fieldId: 'value',
        value: lineRate
    });

    pricePlanRec.setCurrentSublistValue({
        sublistId: 'pricetiers',
        fieldId: 'fromval',
        value: '0'
    });

    pricePlanRec.commitLine({
        sublistId: 'pricetiers'
    });

    var pricePlanID = pricePlanRec.save();

    return pricePlanID;

}

function updateSubscription(subID, oppObj) {
    // This function checks the existing Subscription (based on parameter subID) against the new Opportunity record
    // If the script identifies new items, new items are added by creating a CSV file and loading it accordingly
    // If the script identifies new prices/quantities, a Subscription Change Order is created using the FINAL quantity (not the incremental quantity)

    var subItems = [];
    var subLineItemsArray = [];
    var oppItems = oppObj.items;
    var oppDate = oppObj.startDate;
    var oppType = oppObj.type;

    log.debug('oppType', oppType)

    // Load the existing Subscription
    var subObj = RECORD_MOD.load({
        type: RECORD_MOD.Type.SUBSCRIPTION,
        id: subID,
        isDynamic: false
    });

    var priceLines = subObj.getLineCount({ sublistId: 'priceinterval' });

    // Following code ensures that we are getting an accurate object of the current Subscription by looping through the lines and getting the active dates as of the Opportunity Start Date
    // Loop through the Subscription Lines, but ensures that the Opportunity falls within the range of active subscription lines
    // Even if the Subscription Line is not currently active, the script checks when the line will be active and gets the current quantity/price as of that date
    for (var s = 0; s < priceLines; s++) {
        var subItem = Number(subObj.getSublistValue({
            sublistId: 'priceinterval',
            fieldId: 'item',
            line: s
        }));

        var subItemStartDate = subObj.getSublistValue({
            sublistId: 'priceinterval',
            fieldId: 'startdate',
            line: s
        });

        var subItemQty = Number(subObj.getSublistValue({
            sublistId: 'priceinterval',
            fieldId: 'quantity',
            line: s
        }));

        var subItemRecAmt = Number(subObj.getSublistValue({
            sublistId: 'priceinterval',
            fieldId: 'recurringamount',
            line: s
        }));

        var subItemRate = subItemRecAmt / subItemQty;

        var subItemDiscount = "";

        var subItemStatus = subObj.getSublistValue({
            sublistId: 'priceinterval',
            fieldId: 'status',
            line: s
        });

        if (subItemStatus === "ACTIVE") {
            subItemDiscount = subObj.getSublistValue({
                sublistId: 'priceinterval',
                fieldId: 'discount',
                line: s
            });
        }

        var subItemLineNum = subObj.getSublistValue({
            sublistId: 'priceinterval',
            fieldId: 'linenumber',
            line: s
        });

        // First, the script checks to if the item that is currently being looped on already exists (which would happen if Change Orders were created)
        //      If the item does appear twice in the data, then the script checks the Opportunity Date against the Subscription Line Start Date
        //      If the Opportunity Date is on or after the current item, that becomes the item
        // If the item does not exist, that item gets added to the subscription object

        if (subLineItemsArray.indexOf(subItem) !== -1) // If the Item already exists in the line, execute the following code:
        {
            for (var a = 0; a < subItems.length; a++) // Loop through the lines in the existing array
            {
                if (subItems[a].itemid === subItem) // Once that line is found in the loop, execute the following code:
                {
                    if (oppDate >= subItemStartDate) // If the date from the original opportunity is after or equal to the start date of the current looped on item
                    {
                        // Replace that entire object with the attributes of this item
                        subItems[a] = {
                            line: Number(subItemLineNum),
                            itemid: Number(subItem),
                            quantity: Number(subItemQty),
                            rate: Number(subItemRate),
                            discount: subItemDiscount
                        }
                    }
                }
            }
        }
        else {
            subLineItemsArray.push(subItem);
            subItems.push({
                line: Number(subItemLineNum),
                itemid: Number(subItem),
                quantity: Number(subItemQty),
                rate: Number(subItemRate),
                discount: subItemDiscount,
                date: subItemStartDate
            });
        }


    }


    var newItems = [];

    var existingItems = [];
    var existingItemIDs = [];

    var itemsToUpdate = [];
    var subItemIDArray = [];

    // Loop through the current Subscription Items and add that to an array
    for (var i = 0; i < subItems.length; i++) {
        subItemIDArray.push(subItems[i].itemid);
    }

    // Loops through Opportunity record and if Subscription item does not exist, add to newItems Array
    // If Subscription item does exist, add to existingItems array
    // Note that Connected Car Services Replacement and Connected Car Devices Harness are considered "New Items", since they will be ADDED to the Subscription with a type of "One Time"
    // Consequently, they will be added to the newItems Array and not the existingItems Array

    for (var j = 0; j < oppItems.length; j++) {
        if (subItemIDArray.indexOf(oppItems[j].itemid) === -1 || oppItems[j].itemid === ccdHarnessID || oppItems[j].itemid === connectedCarServRepID) {
            newItems.push(oppItems[j]);
        }
        else {
            existingItemIDs.push(oppItems[j].itemid);
            existingItems.push(oppItems[j]);
        }
    }

    log.debug('existingItems', existingItems)
    log.debug('subItems', subItems)

    // Loop through the existing Subscription Items (not included Connected Car Services Replacement or CCD Harness)
    // If the looped Subscription Item is matched with an existingItem, we push that item's info to the itemsToUpdate array with all of the relevant information for the Subscription Change Order

    for (var k = 0; k < subItems.length; k++) {
        for (var l = 0; l < existingItems.length; l++) {
            if (existingItems[l].itemid === subItems[k].itemid && oppType != amendID) {
                itemsToUpdate.push(
                    {
                        line: subItems[k].line,
                        itemid: subItems[k].itemid,
                        quantity: subItems[k].quantity + existingItems[l].quantity,
                        rate: existingItems[l].rate,
                        discount: existingItems[l].discount
                    })
            }
            else if (existingItems[l].itemid === subItems[k].itemid && oppType == amendID) {
                itemsToUpdate.push(
                    {
                        line: subItems[k].line,
                        itemid: subItems[k].itemid,
                        quantity: existingItems[l].quantity,
                        rate: existingItems[l].rate,
                        discount: existingItems[l].discount
                    })
            }
        }
    }

    log.debug('newItems', newItems);
    log.debug('itemsToUpdate', itemsToUpdate);

    // If there is a value in the existing items (i.e. if there are no new item adds and only price/quantity changes, create change order)

    if (existingItems != "undefined" && existingItems != null && existingItems.length != null && existingItems.length > 0) {
        try {
            createChangeOrder(subID, itemsToUpdate, oppObj);
        }
        catch (e) {
            var errMsg;
            errMsg = e.name + '\n' + e.message;
            updateErrorMessage(oppObj.id, errMsg)
            log.error('system error', errMsg);
        }
    }

    // If there are any new items in the newItems array, (i.e. new products), we follow process of creating a CSV file for adding Subscription Lines

    if (newItems != "undefined" && newItems != null && newItems.length != null && newItems.length > 0) {
        for (var h = 0; h < newItems.length; h++) {
            // Following code makes sure that the first line number (h = 0, first iteration) on the new items array is the existing Subscription Lines + 1
            // And every subsequent iteration takes the line number from the previous iteration and adds one - ensuring that they are added in a sequential order
            if (h === 0) {
                newItems[h].line = (subItems.length + 1);
            }

            else {
                newItems[h].line = newItems[h - 1].line + 1;
            }
        }

        try {

            addItems(subID, newItems, oppObj.currency);

            RECORD_MOD.submitFields({
                type: 'customrecord_sc_sfs_opportunity',
                id: oppObj.id,
                values: {
                    'custrecord_sc_sfs_opp_ns_rec_created': true
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
        }

        catch (e) {
            var errMsg;
            errMsg = e.name + '\n' + e.message;
            updateErrorMessage(oppObj.id, errMsg)
            log.error('system error', errMsg);
        }
    }

}

function createChangeOrder(subID, updateItems, oppObj) {

    // This function creates a Subscription Change Order - Modify Pricing based on the info from the "updateItems" parameter

    log.debug('oppObj', oppObj)
    var effectiveDate = oppObj.startDate;

    var updateItemsArr = [];

    // Loops through updateItems array and creates an array of the item IDs to be updated
    // Note that these two arrays should have their items in the exact same order
    for (var i = 0; i < updateItems.length; i++) {
        updateItemsArr.push(updateItems[i].itemid)
    }

    var changeOrder = RECORD_MOD.create({
        type: RECORD_MOD.Type.SUBSCRIPTION_CHANGE_ORDER,
        isDynamic: true,
        defaultValues: {
            action: "MODIFY_PRICING",
            subscription: subID
        }
    });

    // First sets the date to the effective date from the Opportunity record
    changeOrder.setValue({
        fieldId: 'effectivedate',
        value: effectiveDate,
        ignoreFieldChange: false
    });

    // Loop through the Subscription Change Order and once the line is identified, the index above is used to set the price and quantity information from the updateItems array

    var numLines = changeOrder.getLineCount({ sublistId: 'subline' });

    for (var m = 0; m < numLines; m++) {

        changeOrder.selectLine({ sublistId: 'subline', line: m })

        var changeOrderLineItem = changeOrder.getCurrentSublistValue({ sublistId: 'subline', fieldId: 'item' });

        var changeOrderLineItemStatus = changeOrder.getCurrentSublistValue({ sublistId: 'subline', fieldId: 'status' });


        var subItemIndex = updateItemsArr.indexOf(changeOrderLineItem);


        if (subItemIndex !== -1 && changeOrderLineItemStatus == 'ACTIVE') {
            changeOrder.setCurrentSublistValue({
                sublistId: 'subline',
                fieldId: 'apply',
                value: true
            });

            changeOrder.setCurrentSublistValue({
                sublistId: 'subline',
                fieldId: 'quantitynew',
                value: updateItems[subItemIndex].quantity
            });

            changeOrder.setCurrentSublistValue({
                sublistId: 'subline',
                fieldId: 'discountnew',
                text: updateItems[subItemIndex].discount
            });

            var newPricePlan = createPricePlan(updateItems[subItemIndex].rate, oppObj.currency);

            changeOrder.setCurrentSublistValue({
                sublistId: 'subline',
                fieldId: 'priceplannew',
                value: newPricePlan
            });

        }

        changeOrder.commitLine({ sublistId: 'subline' })

    }



    var changeOrderID = changeOrder.save();

    // Submits to Opportunity record that it has been processed
    RECORD_MOD.submitFields({
        type: 'customrecord_sc_sfs_opportunity',
        id: oppObj.id,
        values: {
            'custrecord_sc_sfs_opp_ns_co_id': changeOrderID,
            'custrecord_sc_sfs_opp_ns_rec_created': true
        },
        options: {
            enableSourcing: false,
            ignoreMandatoryFields: true
        }
    });

    log.debug('changeOrder saved', changeOrderID);

}

function terminateSubscriptionLine(subID, oppObj) {
    // Following code creates a Subscription Change Order - Terminate for the items from the Opportunity based on the Opportunity Start Date

    var effectiveDate = oppObj.startDate;

    var oppItems = oppObj.items;
    var terminateItems = [];

    // Loop through the Opportunity record and find all the items

    for (var i = 0; i < oppItems.length; i++) {
        terminateItems.push(oppItems[i].itemid)
    }

    var changeOrder = RECORD_MOD.create({
        type: RECORD_MOD.Type.SUBSCRIPTION_CHANGE_ORDER,
        defaultValues: {
            action: "TERMINATE",
            subscription: subID
        }
    });

    changeOrder.setValue({
        fieldId: 'effectivedate',
        value: effectiveDate,
        ignoreFieldChange: true
    });

    var numLines = changeOrder.getLineCount({ sublistId: 'subline' });

    // Loops through Change Order lines and if a match is found from the Opportunity record loop, apply the Terminate Change Order to that line

    for (var m = 0; m < numLines; m++) {
        var changeOrderLineItem = changeOrder.getSublistValue({
            sublistId: 'subline',
            fieldId: 'item',
            line: m
        });


        var subItemIndex = terminateItems.indexOf(changeOrderLineItem);


        if (subItemIndex !== -1) {
            changeOrder.setSublistValue({
                sublistId: 'subline',
                fieldId: 'apply',
                line: m,
                value: true
            });

        }

    }



    var changeOrderID = changeOrder.save();

    // Submits to Opportunity record that it has been processed
    RECORD_MOD.submitFields({
        type: 'customrecord_sc_sfs_opportunity',
        id: oppObj.id,
        values: {
            'custrecord_sc_sfs_opp_ns_co_id': changeOrderID,
            'custrecord_sc_sfs_opp_ns_rec_created': true
        },
        options: {
            enableSourcing: false,
            ignoreMandatoryFields: true
        }
    });

    log.debug('changeOrder saved', changeOrderID);

}

function terminateSubscription(subID, oppObj) {
    // Following code creates a Subscription Change Order - Terminate for all active Subscription Lines based on the Opportunity Start Date
    var effectiveDate = oppObj.startDate;

    var changeOrder = RECORD_MOD.create({
        type: RECORD_MOD.Type.SUBSCRIPTION_CHANGE_ORDER,
        defaultValues: {
            action: "TERMINATE",
            subscription: subID
        }
    });

    changeOrder.setValue({
        fieldId: 'effectivedate',
        value: effectiveDate,
        ignoreFieldChange: true
    });

    var numLines = changeOrder.getLineCount({ sublistId: 'subline' });

    // Loops through lines and ensures the Subscription Change Order applies to all active lines
    for (var m = 0; m < numLines; m++) {
        var subLineStatus = changeOrder.getSublistValue({
            sublistId: 'subline',
            fieldId: 'status',
            line: m
        });

        if (subLineStatus === 'ACTIVE') {
            changeOrder.setSublistValue({
                sublistId: 'subline',
                fieldId: 'apply',
                line: m,
                value: true
            });
        }

    }


    var changeOrderID = changeOrder.save();

    // Submits to Opportunity record that it has been processed

    RECORD_MOD.submitFields({
        type: 'customrecord_sc_sfs_opportunity',
        id: oppObj.id,
        values: {
            'custrecord_sc_sfs_opp_ns_co_id': changeOrderID,
            'custrecord_sc_sfs_opp_ns_rec_created': true
        },
        options: {
            enableSourcing: false,
            ignoreMandatoryFields: true
        }
    });

    log.debug('changeOrder saved', changeOrderID);

}