/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record', "N/format"
], function (search, record, format) {

    const getInputData = () => {

        var invoiceCreditMemoSearch = search.load({
            id: 3078
        })

        return invoiceCreditMemoSearch
    }

    const map = (context) => {

        var invCreditMemoRecResult = JSON.parse(context.value);
         log.debug('searchResult : ', invCreditMemoRecResult);
        try {
            var newRec = record.load({
                //type: invCreditMemoRecResult.recordType,
              type:'invoice',
                id: invCreditMemoRecResult.values['GROUP(internalid)'].value
            });
            var customerId = newRec.getValue('entity');
            var CommissionType = newRec.getValue('custbodyinvoice_typecom');
            if (CommissionType != "") {
                var processLine = false;
                log.debug('------------------------------------ ')
                log.debug('CommissionType ', CommissionType)
                log.debug('Invoice Id ', invCreditMemoRecResult.id)
                var commissionToBeApplied;
                var salesRepRate1 = "";
                var salesRepRate2 = "";
                var PartnerRate1 = "";
                var PartnerRate2 = "";
                // var custFields = search.lookupFields({
                //     type: "customer",
                //     id: customerId,
                //     columns: ['custentitydfs_type_commission'] //"custentity31", "custentity32", "custentity33"
                // });
                // log.debug('custFields.custentitydfs_type_commission: ', custFields)
                // log.debug('custFields.custentitydfs_type_commission: ', custFields.custentitydfs_type_commission[0].value)
                if (CommissionType == "1") {
                    var salesRepId = newRec.getValue('salesrep');
                    var salesRepFields = search.lookupFields({
                        type: "employee",
                        id: salesRepId,
                        columns: ['custentity_amz_sales_profit_1']
                    });
                    commissionToBeApplied = parseFloat((salesRepFields.custentity_amz_sales_profit_1).toString().split('.'))
                    processLine = true;

                } else if (CommissionType == "2") {
                    var partnerId = newRec.getValue('partner');
                    var partnerFields = search.lookupFields({
                        type: "partner",
                        id: partnerId,
                        columns: ['custentity_amz_sales_profit_1']
                    });
                    commissionToBeApplied = parseFloat((partnerFields.custentity_amz_sales_profit_1).toString().split('.'))
                    processLine = true;
                }
                // else if (CommissionType == "3") {
                //     newRec.setValue({ fieldId: "custbody_split_commissions", value: true })
                //     var total_rate = 0;
                //     var salesRep1_rate = newRec.getValue('custbody37');
                //     var salesRep2_rate = newRec.getValue('custbodydfs_rateb_');
                //     var partner1_rate = newRec.getValue('custbodydfs_partnerarate_');
                //     var partner2_rate = newRec.getValue('custbodydfs_partnerbrate_');
                //     // var salesRep1_rate = custFields.getValue('custbody37'); // add customer split field
                //     // var salesRep2_rate = custFields.getValue('custbodydfs_rateb_');
                //     // var partner1_rate = custFields.getValue('custbodydfs_partnerarate_');
                //     // var partner2_rate = custFields.getValue('custbodydfs_partnerbrate_');

                //     // log.debug('salesRep1_rate ', salesRep1_rate)
                //     // log.debug('salesRep2_rate ', salesRep2_rate)
                //     // log.debug('partner1_rate ', partner1_rate)
                //     // log.debug('partner2_rate', partner2_rate);
                //     if (salesRep1_rate != "") {
                //         total_rate += Number(salesRep1_rate);
                //         salesRepRate1 = Number(salesRep1_rate);
                //     }
                //     if (salesRep2_rate != "") {
                //         total_rate += Number(salesRep2_rate);
                //         salesRepRate2 = Number(salesRep2_rate);
                //     }
                //     if (partner1_rate != "") {
                //         total_rate += Number(partner1_rate);
                //         PartnerRate1 = Number(partner1_rate)
                //     }
                //     if (partner2_rate != "") {
                //         total_rate += Number(partner2_rate);
                //         PartnerRate2 = Number(partner2_rate);
                //     }
                //     if (total_rate > 50) {
                //         if (salesRep1_rate != "") {
                //             total_rate += (Number(salesRep1_rate) / 2);
                //             salesRepRate1 = Number(salesRep1_rate);
                //         }
                //         if (salesRepRate2 != "") {
                //             total_rate += (Number(salesRep2_rate) / 2);
                //             salesRepRate2 = Number(salesRep2_rate);
                //         }
                //         if (PartnerRate1 != "") {
                //             total_rate += (Number(partner1_rate) / 2);
                //             PartnerRate1 = Number(partner1_rate)
                //         }
                //         if (PartnerRate2 != "") {
                //             total_rate += (Number(partner2_rate) / 2);
                //             PartnerRate2 = Number(partner2_rate);
                //         }
                //     }
                //     commissionToBeApplied = parseFloat(total_rate);

                //     processLine = true;
                // }
                log.debug('processLine : ', processLine)
                log.debug('Commission To Be Applied : ', commissionToBeApplied)

                if (processLine) {
                    var subtotal_commission = 0
                    var invLineItemCount = newRec.getLineCount({ sublistId: "item" });
                    for (var i = 0; i < invLineItemCount; i++) {

                        var itemId = newRec.getSublistValue('item', 'item', i);
                        var Est_extended_cost = newRec.getSublistValue('item', 'costestimate', i);
                        var amount = newRec.getSublistValue('item', 'amount', i);
                        var account = newRec.getSublistValue('item', 'account', i);

                        if (Est_extended_cost == "") {
                            Est_extended_cost = 0
                        }
                        if (amount == "") {
                            amount = 0
                        }
                        Est_GrossProfit = (amount - Est_extended_cost).toFixed(2)
                        // log.debug("Est_GrossProfit : ", Est_GrossProfit);

                        var accArray = ["590", "592", "594", "596"]

                        if (accArray.includes(account)) {
                            log.debug("itemId : ", itemId);
                            log.debug("Account with 10% found : ");
                            var comm_amt = parseFloat(Est_GrossProfit * (10.0 / 100))
                            // log.debug("comm_amt : ", comm_amt);
                            if (comm_amt > 0) {
                                subtotal_commission += comm_amt;
                            }
                            newRec.setSublistValue('item', 'custcol_dfs_sales_rate', i, 10.0);
                            newRec.setSublistValue('item', 'custcol_amz_commission_amount', i, comm_amt);
                        } else if (account == "593") {
                            log.debug("itemId : ", itemId);
                            log.debug("Account with 0% found : ");
                            var comm_amt = parseFloat(Est_GrossProfit * (0.00 / 100));
                            // log.debug("comm_amt : ", comm_amt);
                            if (comm_amt > 0) {
                                subtotal_commission += comm_amt;
                            }
                            newRec.setSublistValue('item', 'custcol_dfs_sales_rate', i, 0.00);
                            newRec.setSublistValue('item', 'custcol_amz_commission_amount', i, comm_amt);

                        } else {
                            var comm_amt = parseFloat(Est_GrossProfit * (commissionToBeApplied / 100));
                            // log.debug("comm_amt : ", comm_amt);
                            if (comm_amt > 0) {
                                subtotal_commission += comm_amt;
                            }
                            newRec.setSublistValue('item', 'custcol_dfs_sales_rate', i, commissionToBeApplied);
                            newRec.setSublistValue('item', 'custcol_amz_commission_amount', i, comm_amt);
                        }

                    }


                    log.debug("subtotal commission : ", subtotal_commission)

                    var final_Commission = subtotal_commission;
                    var adj_commission = newRec.getValue({ fieldId: "custbodycom_adjust" })
                    if (final_Commission < 0) {
                        final_Commission = 0
                    }
                    log.debug("adj_commission : ", adj_commission)
                    if (adj_commission != "") {
                        final_Commission = (final_Commission + (adj_commission));
                        log.debug("final_Commission : ", final_Commission)
                        log.debug("subtotal comission : ", subtotal_commission)
                        newRec.setValue({ fieldId: "custbody_amz_commission", value: subtotal_commission })
                        newRec.setValue({ fieldId: "custbodyfinal_commission", value: final_Commission })
                        // if (CommissionType == "3") {
                        //     if (salesRepRate1 != "") {
                        //         var salesRepRate1_comm = ((final_Commission / commissionToBeApplied) * salesRepRate1);
                        //         log.debug("salesRepRate1_comm : ", salesRepRate1_comm)
                        //         newRec.setValue({ fieldId: "custbodydfs_commission1_", value: Math.round(salesRepRate1_comm) })
                        //     }
                        //     if (salesRepRate2 != "") {
                        //         var salesRepRate2_comm = ((final_Commission / commissionToBeApplied) * salesRepRate2);
                        //         log.debug("salesRepRate2_comm : ", salesRepRate2_comm)
                        //         newRec.setValue({ fieldId: "custbodydfs_commissionb_", value: Math.round(salesRepRate2_comm) })
                        //     }
                        //     if (PartnerRate1 != "") {
                        //         var partnerRate1_comm = ((final_Commission / commissionToBeApplied) * PartnerRate1);
                        //         log.debug("partnerRate1_comm: ", partnerRate1_comm)
                        //         newRec.setValue({ fieldId: "custbodydfs_paacommission_", value: Math.round(partnerRate1_comm) })
                        //     }
                        //     if (PartnerRate2 != "") {
                        //         var partnerRate2_comm = ((final_Commission / commissionToBeApplied) * PartnerRate2);
                        //         log.debug("partnerRate2_comm : ", partnerRate2_comm)
                        //         newRec.setValue({ fieldId: "custbodydfs_partnerbcom_", value: Math.round(partnerRate2_comm) })
                        //     }
                        // }
                    } else {
                        newRec.setValue({ fieldId: "custbody_amz_commission", value: subtotal_commission })
                        newRec.setValue({ fieldId: "custbodyfinal_commission", value: subtotal_commission })
                        // if (CommissionType == "3") {
                        //     if (salesRepRate1 != "") {
                        //         var salesRepRate1_comm = ((final_Commission / commissionToBeApplied) * salesRepRate1);
                        //         log.debug("salesRepRate1_comm : ", salesRepRate1_comm)
                        //         newRec.setValue({ fieldId: "custbodydfs_commission1_", value: Math.round(salesRepRate1_comm) })
                        //     }
                        //     if (salesRepRate2 != "") {
                        //         var salesRepRate2_comm = ((final_Commission / commissionToBeApplied) * salesRepRate2);
                        //         log.debug("salesRepRate2_comm : ", salesRepRate2_comm)
                        //         newRec.setValue({ fieldId: "custbodydfs_commissionb_", value: Math.round(salesRepRate2_comm) })
                        //     }
                        //     if (PartnerRate1 != "") {
                        //         var partnerRate1_comm = ((final_Commission / commissionToBeApplied) * PartnerRate1);
                        //         log.debug("partnerRate1_comm : ", partnerRate1_comm)
                        //         newRec.setValue({ fieldId: "custbodydfs_paacommission_", value: Math.round(partnerRate1_comm) })
                        //     }
                        //     if (PartnerRate2 != "") {
                        //         var partnerRate2_comm = ((final_Commission / commissionToBeApplied) * PartnerRate2);
                        //         log.debug("partnerRate2_comm : ", partnerRate2_comm)
                        //         newRec.setValue({ fieldId: "custbodydfs_partnerbcom_", value: Math.round(partnerRate2_comm) })
                        //     }
                        // }
                    };
                    // if (CommissionType == "3") {
                    //     newRec.setValue({ fieldId: "custbody_lsk_split_comm_rate", value: commissionToBeApplied });
                    // }


                }
            }
            newRec.setValue({ fieldId: "custbody_comm_calculated", value: true });


            var saveInvCreditMemoRec = newRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug("Commission Calculated on invoice id ", saveInvCreditMemoRec)
            log.debug('------------------------------------ ')
        }
        catch (e) {

            log.debug("e ", e)
        }

    }
  
    return {
        getInputData,
        map
    }

});