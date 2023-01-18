/**
*@NApiVersion 2.x
*@NScriptType ClientScript
*/
define(['N/search', 'N/ui/dialog', "N/record"],
    function (search, dialog, record) {
        var fieldChangeIds = [];
        function fieldChanged(context) {
            var fieldId = context.fieldId
            var value = context.currentRecord.getValue({ fieldId: fieldId })
            fieldChangeIds.push({ "fieldId": value })

        }

        function saveRecord(context) {
            log.debug('Field ids : ', fieldChangeIds)

            for (var key in Object.keys(fieldChangeIds)) {
                log.debug('field id : ', key)
                if (key == 'custbody_cmms_requesting_contact') {}
                else if (key == 'custpage_requesting_contract') {} 
                else if (key == 'custbody_send_mail') {} 
                else if (key == 'custbody_cmms_requesting_contact_phone') {} 
                else {
                    var options = {
                        title: 'Confirm',
                        message: 'Do you want to send massage of this field change.'
                    };
        
                    //Send mail if user press ok
                    function success(result) {
                        //log.debug('Success with value ' + result);
                        var proc = context.currentRecord.getValue({ fieldId: 'custbody_send_mail' })
                        
                        context.currentRecord.setValue({ fieldId: 'custbody_send_mail', value: true })
        
                        var otherId = record.submitFields({
                            type: 'salesorder',
                            id: context.currentRecord.id,
                            values: {
                                'custbody_send_mail': true
                            }
                        });
                        log.debug('otherId ', otherId);
                    }
                    function failure(reason) {
                        log.debug('Failure: ' + reason);
                    }
                    dialog.confirm(options).then(success).catch(failure);
                }
            }

            var currentIds = context.currentRecord.getValue({ fieldId: 'custbody_ids_to_send_notification' })
            for (var key in Object.keys(fieldChangeIds)) {
                log.debug('keys : ', key)
                if (key == 'custbody_cmms_requesting_contact') {
                } else if (key == 'custpage_requesting_contract') {
                } else if (key == 'custbody_send_mail') {
                } else if (key == 'custbody_cmms_requesting_contact_phone') {
                } else {

                    if (currentIds.includes(key)) {
                        var oldfieldValue = context.currentRecord.getValue({ fieldId: key })
                        currentIds.replace(oldfieldValue, fieldChangeIds[key].fieldId);
                    } else {
                        currentIds += '<tr> <td> ' + key + ' <td> <td> ' + fieldChangeIds[key].fieldId + ' <td>  <tr>'

                    }
                }
            }
            context.currentRecord.setValue({ fieldId: 'custbody_ids_to_send_notification', value: currentIds })
            log.debug('currentIds : ', currentIds)
            return true
        }
        
        return {

            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };
    });


