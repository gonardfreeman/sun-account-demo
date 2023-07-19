public with sharing class FinancialServicesAccountListController {
	@AuraEnabled
	public static Map<String, AccountFieldDescribe> getEditable(List<String> fieldList) {
		Map<String, AccountFieldDescribe> result = new Map<String, AccountFieldDescribe>();
		if (fieldList == null || fieldList.isEmpty()) {
			return result;
		}
		Schema.DescribeSObjectResult accountDescribe = Account.sObjectType.getDescribe();
		Map<String, Schema.SObjectField> fieldsMap = accountDescribe.fields.getMap();
		for (String fieldName : fieldList) {
			Schema.DescribeFieldResult fieldDescribe = fieldsMap.get(fieldName).getDescribe();
			result.put(
				fieldName,
				new AccountFieldDescribe(fieldName, fieldDescribe.getType().name(), fieldDescribe.isUpdateable())
			);
		}
		return result;
	}

	@AuraEnabled
	public static Map<Id, Account> updateAccounts(String accounts) {
		List<Account> accs = (List<Account>) JSON.deserialize(accounts, List<Account>.class);
		try {
			update accs;
		} catch (Exception e) {
			throw new AuraHandledException(e.getMessage());
		}
		return new Map<Id, Account>(accs);
	}

	@AuraEnabled
	public static List<Account> getAccounts(String accountName, Map<String, String> sortOrder) {
		String fieldName = 'Name';
		String realFieldName = 'Name';
		if (!sortOrder.isEmpty()) {
			fieldName = new List<String>(sortOrder.keySet())[0];
			realFieldName = fieldName;
			if (fieldName == 'OwnerId') {
				fieldName = 'Owner.Name';
			}
		}
		String query = 'SELECT Id, Name, OwnerId, Owner.Name, Phone, Website, AnnualRevenue';
		query += ' FROM Account';
		query += ' WHERE Industry = \'Financial Services\' AND Name LIKE \'%' + accountName + '%\'';
		query += ' ORDER BY ' + fieldName + ' ' + sortOrder.get(realFieldName);
		query += ' LIMIT 200';
		try {
			return Database.query(query);
		} catch (Exception e) {
			throw new AuraHandledException(e.getMessage());
		}
	}

	public class AccountFieldDescribe {
		@AuraEnabled
		public String fieldName;
		@AuraEnabled
		public String fieldType;
		@AuraEnabled
		public Boolean isEditable;

		public AccountFieldDescribe(String fieldName, String fieldType, Boolean isEditable) {
			this.fieldName = fieldName;
			this.fieldType = fieldType;
			this.isEditable = isEditable;
		}
	}
}
