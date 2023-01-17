/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([],
    () => {
        const beforeLoad = (context) => {
            if (context.type == 'view') {
                try {
                    const custId = context.newRecord.id;
                    const JsonParentRecord = JSON.stringify(context.newRecord);
                    log.debug("custId : parent", custId)
                    log.debug("JsonParentRecord", JsonParentRecord)
                    context.form.clientScriptModulePath = "./cs_create_copy_record.js";
                    context.form.addButton({
                        id: "custpage_customer_create_estimate",
                        label: "Make Copy",
                        functionName: `createCopy(${custId},${JsonParentRecord})`
                    });


                } catch (e) {
                    log.error({ title: 'UE Error', details: e });
                }
            }
        }
        return { beforeLoad };
    }
);