import { LightningElement, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getAccounts from "@salesforce/apex/FinancialServicesAccountListController.getAccounts";
import getEditable from "@salesforce/apex/FinancialServicesAccountListController.getEditable";
import updateAccounts from "@salesforce/apex/FinancialServicesAccountListController.updateAccounts";

const ACCOUNT_FIELDS = ["Name", "OwnerId", "Phone", "Website", "AnnualRevenue"];
const COLUMNS = [
	{
		label: "Name",
		fieldName: "Name",
		type: "text",
		editable: false,
		showSort: true,
		iconName: "utility:arrowdown",
	},
	{
		label: "Owner",
		fieldName: "OwnerId",
		type: "text",
		editable: false,
		showSort: true,
		iconName: "utility:arrowdown",
	},
	{ label: "Phone", fieldName: "Phone", type: "phone", editable: false },
	{ label: "Website", fieldName: "Website", type: "url", editable: false },
	{ label: "Annual Revenue", fieldName: "AnnualRevenue", type: "currency", editable: false },
];

const DEFAULT_SORT = {
	Name: "ASC",
};

class FinancialServices extends LightningElement {
	accountName = "";
	@track sortOrder = DEFAULT_SORT;

	@track currentEdit = {};

	@track columns = COLUMNS;

	@track accounts = [];

	get showSaveButton() {
		return Object.keys(this.currentEdit).length > 0;
	}

	async handleSortChange(e) {
		let fieldName = e.currentTarget.dataset.name;
		this.sortOrder = {
			[fieldName]: this.sortOrder[fieldName] === "ASC" ? "DESC" : "ASC",
		};
		this.columns = this.columns.map((c) => {
			if (fieldName === c.fieldName) {
				return {
					...c,
					iconName: this.sortOrder[fieldName] === "ASC" ? "utility:arrowdown" : "utility:arrowup",
				};
			}
			return c;
		});
		try {
			await this.loadAccounts();
		} catch (err) {
			console.error(err);
		}
	}

	async handleAccountSearch(e) {
		this.accountName = e.detail.value;
		await this.loadAccounts();
	}

	async loadAccounts() {
		try {
			this.accounts = await getAccounts({ accountName: this.accountName, sortOrder: this.sortOrder });
		} catch (err) {
			console.error(err);
		}
	}

	handleEditRecord(e) {
		let curAccount = this.accounts.find((a) => a.Id === e.detail.recordId);
		if (!curAccount) {
			return;
		}
		let oldValue = {};
		if (this.currentEdit[e.detail.recordId]) {
			oldValue = this.currentEdit[e.detail.recordId];
		}
		let newValue = {
			...oldValue,
			Id: e.detail.recordId,
			[e.detail.fieldName]: e.detail.value,
		};

		this.currentEdit = {
			...this.currentEdit,
			[e.detail.recordId]: newValue,
		};
	}

	handleCancelEdit(e) {
		if (!this.currentEdit[e.detail.recordId]) {
			return;
		}
		let copy = { ...this.currentEdit[e.detail.recordId] };
		delete copy[e.detail.fieldName];
		if (Object.keys(copy).length > 0) {
			this.currentEdit = {
				...this.currentEdit,
				[e.detail.recordId]: copy,
			};
			return;
		}
		delete this.currentEdit[e.detail.recordId];
	}

	async handleSave() {
		if (Object.keys(this.currentEdit).length < 1) {
			return;
		}
		try {
			const resp = await updateAccounts({ accounts: JSON.stringify(Object.values(this.currentEdit)) });
			if (Object.keys(resp).length < 1) {
				return;
			}
			this.accounts = this.accounts.map((acc) => {
				if (resp[acc.Id]) {
					return {
						...acc,
						...resp[acc.Id],
					};
				}
				return acc;
			});
			this.handleCancel();
			const evt = new ShowToastEvent({
				title: "Success",
				message: "Records updated successfully",
				variant: "success",
			});
			this.dispatchEvent(evt);
		} catch (err) {
			console.error(err);
		}
	}

	handleCancel() {
		this.currentEdit = {};
		this.template.querySelectorAll("c-table-row").forEach((el) => {
			el.cancelEdit();
		});
	}

	async connectedCallback() {
		let resp = {};
		try {
			resp = await getEditable({ fieldList: ACCOUNT_FIELDS });
			await this.loadAccounts();
		} catch (err) {
			console.error(err);
		}
		this.columns = this.columns.map((c) => ({
			...c,
			...resp[c.fieldName],
			editable: c.fieldName !== "OwnerId" && resp[c.fieldName] && resp[c.fieldName].isEditable === true,
		}));
	}
}

export default FinancialServices;
