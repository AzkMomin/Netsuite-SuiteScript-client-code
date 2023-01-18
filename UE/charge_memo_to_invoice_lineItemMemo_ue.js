/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */

define(['N/record'], function (record) {

    return {
        afterSubmit: function (context) {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var newRecord = context.newRecord;


                var chargeLIneCount = newRecord.getLineCount({
                    sublistId: 'item',
                })

                for (var i = 0; i < chargeLIneCount; i++) {
                    var chargeId = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'charge',
                        line: i,
                    })

                    var chargeRecord = record.load({
                        type: record.Type.CHARGE,
                        id: chargeId
                    });


                    var memo = chargeRecord.getValue({
                        fieldId: 'memo'
                    })

                    newRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'memo',
                        line: i,
                        value : memo
                    })
                    newRecord.save()

                }

            }
        }
    }


})