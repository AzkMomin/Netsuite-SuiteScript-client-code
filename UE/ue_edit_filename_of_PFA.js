/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/file"], function (search, record, file) {


    const afterSubmit = (context) => {

        // Work on create or edit
        if (context.type == 'create' || context.type == 'edit') {
            let newRec = context.newRecord;
            let newRecID = context.newRecord.id;
            let subsidiaryId = newRec.getValue({ fieldId: "custrecord_2663_payment_subsidiary" });
            var subsidiaryRec = record.load({
                type: 'subsidiary',
                id: subsidiaryId,
                isDynamic: true
            });

            let subsidiaryName = subsidiaryRec.getValue({ fieldId: "name" });
            log.debug("subsidiaryName : ", subsidiaryName);
            let codeArray = (subsidiaryName).split(" ");
            let code = codeArray[0];

            log.debug("Subsidiary code : ", code);


            let fileRecordID = newRec.getValue({ fieldId: "custrecord_2663_file_ref" });
            var fileObj = file.load({
                id: fileRecordID
            });
            
            // fileObj.name = 'myOldImageFile.jpg';
            log.debug("fileObj.name : ", fileObj.name);
            let updatedName = `${code} - ${fileObj.name}`;
            log.debug("updatedName : ", updatedName);

            fileObj.name = updatedName;

            const fileObject = fileObj.save()
            log.debug("File updated name ID : ", fileObject);
        }


    }




    return {

        afterSubmit,
    }
});