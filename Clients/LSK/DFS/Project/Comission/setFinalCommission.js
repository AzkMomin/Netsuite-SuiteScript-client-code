/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/search', 'N/ui/dialog', "N/record"],
    function (search, dialog, record) {

        function postSourcing(context) {

            if (context.fieldId == "custbodyfinal_commission") {

                var commission = context.currentRecord.getValue({
                    fieldId: "custbody_amz_commission_",
                });
                var adjCommission = context.currentRecord.getValue({
                    fieldId: "custbodycom_adjust",
                });

                var finalCommission = commission + (adjCommission)
                context.currentRecord.setValue({
                    fieldId: "custbodyfinal_commission",
                    value : finalCommission
                });


            }
            return true;
        }
        return {

            postSourcing: postSourcing,

        };
    });
