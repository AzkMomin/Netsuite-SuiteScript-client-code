/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([],
    () => {
        const beforeLoad = (context) => {
            try {
                const custId = context.newRecord.id;
                context.form.addButton({
                    id: "custpage_create_project",
                    label: "Project Record",
                    functionName: `triggerMR()`
                });
                // context.form.clientScriptModulePath = "SuiteScripts/XYZ/cs_create_estimate.js";
            } catch(e) {
                log.error({title: 'UE Error', details: e});
            }
        }

        const triggerMR =()=>{
            log.debug('ok')
        }
        return {beforeLoad};
    }
);