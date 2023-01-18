/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/search', "N/currentRecord"],
    function (search, currentRecord) {
        var fieldChangeIds = [];

        function fieldChanged(context) {

            var id = context.fieldId
            if (id == 'custbody_cmms_requesting_contact') { }
            else if (id == 'custpage_requesting_contract') { }
            else if (id == 'custbody_send_mail') { }
            else if (id == 'custbody_cmms_requesting_contact_phone') { }
            else {
                fieldChangeIds.push(context.fieldId)

            }

        }

        function saveRecord(context) {
            var record = currentRecord.get();



            if (fieldChangeIds.length > 0) {
                try {
                    if (window.confirm("Do you want to send message of this field change?")) {
                        var currentIdsJSON = context.currentRecord.getText({ fieldId: 'custbody_field_changed_ids' })
                        log.debug('currentIdsJSON : ' + currentIdsJSON);
                        log.debug('currentIdsJSON : ' +typeof currentIdsJSON);
                        //log.debug('currentIdsJSON length : ' + JSON.parse(Object.keys(currentIdsJSON).length == 0));
                        if (JSON.parse(Object.keys(currentIdsJSON).length == 0)) {
                            var data = {};
                            
                            setdata(data,fieldChangeIds,record)
                        }
                        else {
                            log.debug('data found')
                            var parseCurrentIds = JSON.parse(currentIdsJSON)
                            setdata(parseCurrentIds,fieldChangeIds,record)
                           
                            
                        }
                    }

                    return true;
                }
                catch (e) {
                    log.debug('Error : ', e)
                    return false;
                }
            }
            return true
        }


        function setdata(obj,fieldChangeIds,record){
            var data = obj
            for (var i = 0; i < fieldChangeIds.length; i++) {
                var newfieldValue = record.getValue({ fieldId: fieldChangeIds[i] })
                data[fieldChangeIds[i]] = newfieldValue


            }
            var stringCurrentIds = JSON.stringify(data);
            record.setText({ fieldId: 'custbody_field_changed_ids', text: stringCurrentIds });

            var tableData = ""
            for (var key in data) {
                tableData += '<tr> <td> ' + key + ' </td> <td> ' + data[key] + ' </td>  </tr>'
                log.debug(`key : ${key} , data : ${data[key]}`)
            }
            log.debug("tableData : " + tableData)

            record.setValue({ fieldId: 'custbody_ids_to_send_notification', value: tableData });
            record.setValue({ fieldId: 'custbody_send_mail', value: true });
        }
        return {
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };
    });


