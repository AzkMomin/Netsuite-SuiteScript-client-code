/**
 * @NApiversion 2.0
 * @NScriptType UserEventScript
 */

define(['N/search', 'N/ui/dialog'], function (search, dialog) {
    function beforeSubmit(context) {
        if (context.type == "create" || context.type == "edit") {

            var newRec = context.newRecord;
            var customerId = newRec.getValue('entity');

            var commissionToBeApplied;
            var custFields = search.lookupFields({
                type: "customer",
                id: customerId,
                columns: ['custentitydfs_type_commission', "custentity31", "custentity32", "custentity33"]
            });
            log.debug('custFields.custentitydfs_type_commission: ', custFields)
            log.debug('custFields.custentitydfs_type_commission: ', custFields.custentitydfs_type_commission[0].value)
            if (custFields.custentitydfs_type_commission[0].value == "1") {
                var salesRepId = newRec.getValue('salesrep');
                var salesRepFields = search.lookupFields({
                    type: "employee",
                    id: salesRepId,
                    columns: ['custentity_amz_sales_profit_1']
                });
                if (custFields.custentity33) {

                    commissionToBeApplied = parseFloat((salesRepFields.custentity_amz_sales_profit_1).toString().split('.'))
                } else {
                    commissionToBeApplied = parseFloat((custFields.custentity31).toString().split('.'))
                }

                log.debug('salesRepFields.custentitydfs_type_commission: ', salesRepFields.custentitydfs_type_commission)
            } else if (custFields.custentitydfs_type_commission[0].value == "2") {
                var partnerId = newRec.getValue('partner');
                var partnerFields = search.lookupFields({
                    type: "partner",
                    id: partnerId,
                    columns: ['custentity_amz_sales_profit_1']
                });
                if (custFields.custentity33) {

                    commissionToBeApplied = parseFloat((partnerId.custentity_amz_sales_profit_1).toString().split('.'))
                } else {
                    commissionToBeApplied = parseFloat((custFields.custentity32).toString().split('.'))
                }

            } else {
                newRec.setValue({ fieldId: "custbody_split_commissions", value: true })
                var total_rate = 0;
                // var salesRep1_rate = newRec.getValue('custbody37');
                // var salesRep2_rate = newRec.getValue('custbodydfs_rateb_');
                // var partner1_rate = newRec.getValue('custbodydfs_partnerarate_');
                // var partner2_rate = newRec.getValue('custbodydfs_partnerbrate_');
                var salesRep1_rate = custFields.getValue('custbody37'); // add customer split field
                var salesRep2_rate = custFields.getValue('custbodydfs_rateb_');
                var partner1_rate = custFields.getValue('custbodydfs_partnerarate_');
                var partner2_rate = custFields.getValue('custbodydfs_partnerbrate_');


                if (salesRep1_rate != "") {
                    total_rate += salesRep1_rate;
                }
                if (salesRep2_rate != "") {
                    total_rate += salesRep2_rate;
                }
                if (partner1_rate != "") {
                    total_rate += partner1_rate;
                }
                if (partner2_rate != "") {
                    total_rate += partner2_rate;
                }
                if (total_rate > 50) {
                    if (salesRep1_rate != "") {
                        total_rate += (salesRep1_rate / 2);
                    }
                    if (salesRep2_rate != "") {
                        total_rate += (salesRep2_rate / 2);
                    }
                    if (partner1_rate != "") {
                        total_rate += (partner1_rate / 2);
                    }
                    if (partner2_rate != "") {
                        total_rate += (partner2_rate / 2);
                    }
                }
                commissionToBeApplied = parseFloat(total_rate)
            }
            log.debug('Partner Commission: ', commissionToBeApplied)


            var subtotal_commission = 0
            var invLineItemCount = newRec.getLineCount({ sublistId: "item" });
            for (var i = 0; i < invLineItemCount; i++) {

                var itemId = newRec.getSublistValue('item', 'item', i);
                log.debug("itemId : ", itemId);
                var Est_extended_cost = newRec.getSublistValue('item', 'costestimate', i);
                var amount = newRec.getSublistValue('item', 'amount', i);
                if (Est_extended_cost == "") {
                    Est_extended_cost = 0
                }
                if (amount == "") {
                    amount = 0
                }
                Est_GrossProfit = (amount - Est_extended_cost).toFixed(2)

                log.debug("Est_GrossProfit : ", Est_GrossProfit);

                var SameAccount = getAccount(itemId);
                log.debug("SameAccount : ", SameAccount);

                if (SameAccount.isFound) {
                    var comm_amt = parseFloat(Est_GrossProfit * (SameAccount.percent / 100))
                    subtotal_commission += comm_amt;
                    log.debug("comm_amt : ", comm_amt);
                    newRec.setSublistValue('item', 'custcol_dfs_sales_rate', i, SameAccount.percent);
                    newRec.setSublistValue('item', 'custcol_amz_commission_amount', i, comm_amt);
                } else {
                    newRec.setSublistValue('item', 'custcol_dfs_sales_rate', i, commissionToBeApplied);
                    var comm_amt = parseFloat(Est_GrossProfit * (commissionToBeApplied / 100))
                    subtotal_commission += comm_amt;
                    log.debug("comm_amt : ", comm_amt);
                    newRec.setSublistValue('item', 'custcol_amz_commission_amount', i, comm_amt);
                }

            }

            log.debug("subtotal comission : ", subtotal_commission)
            var final_Commission = subtotal_commission;
            var adj_commission = newRec.getValue({ fieldId: "custbodydiscount_commission_amount" })
            if (adj_commission != "") {
                final_Commission += adj_commission;
                newRec.setValue({ fieldId: "custbody_amz_commission", value: subtotal_commission })


            } else {
                log.debug("Final comm is not present")
                newRec.setValue({ fieldId: "custbody_amz_commission", value: subtotal_commission })
                newRec.setValue({ fieldId: "custbodyfinal_commission", value: subtotal_commission })

            };

        }


    }

    function getAccount(itemId) {
        var itemSearchObj = search.create({
            type: "item",
            filters:
                [
                    ["internalidnumber", "equalto", itemId]
                ],
            columns:
                [
                    search.createColumn({ name: "incomeaccount", label: "Income Account" }),
                    search.createColumn({ name: "type", label: "Type" }),
                    search.createColumn({ name: "custitem_dfs_sales_rate_override", label: "DFS_SALES RATE (OVERRIDE @ITEM LEVEL)" })
                ]
        }).run().getRange(0, 1);

        var income_acc = itemSearchObj[0].getValue('incomeaccount');

        var item_type = itemSearchObj[0].getValue('type');
        log.debug("income_acc : ", income_acc)

        var AccountIdArray = [
            {
                id: "590",
                percent: 10.0
            },
            {
                id: "592",
                percent: 10.0
            },
            {
                id: "593",
                percent: 0.0
            },
            {
                id: "594",
                percent: 10.0
            },
            {
                id: "596",
                percent: 10.0
            },
        ];

        for (var i = 0; i < AccountIdArray.length; i++) {
            if (AccountIdArray[i].id == income_acc) {
                return {
                    isFound: true,
                    percent: AccountIdArray[0].percent
                }
            }
        }
        return {
            isFound: false,
        }
    }

    return {

        beforeSubmit: beforeSubmit,

    }
});


