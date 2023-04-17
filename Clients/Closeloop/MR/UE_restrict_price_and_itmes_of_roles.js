/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/ui/serverWidget'],
    (record, search, runtime, serverWidget) => {
        const beforeLoad = (context) => {
            try {
                const newRecord = context.newRecord;
                var currentUser = runtime.getCurrentUser();
                var currentRole = currentUser.role;
                log.debug('currentRole : ', currentRole)

                if (currentRole == '4') {
                    var sublist = context.form.getSublist('timeitem');
                    var priceLevel = sublist.getField('price');
                    var rate = sublist.getField('rate');
                    // var lockRate = sublist.getField(columnID);
                    // priceLevel.setDisplayType('hidden');
                    // rate.setDisplayType('hidden');

                    priceLevel.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                    rate.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                } else {
                    var sublist = context.form.getSublist('timeitem');
                    var priceLevel = sublist.getField('price');
                    var rate = sublist.getField('rate');
                    // var lockRate = sublist.getField(columnID);
                    // priceLevel.setDisplayType('hidden');
                    // rate.setDisplayType('hidden');

                    priceLevel.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.NORMAL
                    });
                    rate.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.NORMAL
                    });
                }

            } catch (e) {
                log.error({ title: 'UE Error', details: e });
            }
        }

        return { beforeLoad };
    }
);