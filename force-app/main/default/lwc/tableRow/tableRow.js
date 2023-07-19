import { LightningElement, api } from "lwc";

const formatter = new Intl.NumberFormat(undefined, {
	style: "currency",
	currency: "USD",
});

const TYPE_TO_TYPE = {
	STRING: "text",
	URL: "url",
	PHONE: "tel",
	REFERENCE: "text",
	CURRENCY: "text",
};

class TableRow extends LightningElement {
	_col = null;

	isEdit = false;

	@api
	get col() {
		return this._col;
	}

	set col(v) {
		this._col = v;
	}

	@api record = null;

	@api
	cancelEdit() {
		this.isEdit = false;
	}

	get recordId() {
		return this.record?.Id;
	}

	get fieldType() {
		return this.col?.fieldType;
	}

	get isReference() {
		return this.fieldType === "REFERENCE" || this.col?.fieldName === "Name";
	}

	get isURL() {
		return this.fieldType === "URL";
	}

	get isPhone() {
		return this.fieldType === "PHONE";
	}

	get isUrlType() {
		return this.isPhone || this.isURL || this.isReference;
	}

	get isCurrency() {
		return this.fieldType === "CURRENCY";
	}

	get url() {
		if (this.isReference) {
			return `/${this.record.Id}`;
		}
		if (this.isURL) {
			return this.value;
		}
		if (this.isPhone) {
			return `tel:${this.value}`;
		}
		return "#";
	}

	get isUnknown() {
		return !this.isUrlType && !this.isCurrency;
	}

	get ownerLabel() {
		return this.record?.Owner?.Name;
	}

	get value() {
		if (!this.record || !this.col) {
			return "";
		}
		if (this.isReference && this.col?.fieldName === "OwnerId") {
			return this.ownerLabel;
		}
		return this.record[this.col.fieldName];
	}

	get currencyValue() {
		return formatter.format(this.value);
	}

	get isEditable() {
		return this.col?.editable === true;
	}

	get inputType() {
		if (!this.fieldType) {
			return "text";
		}
		return TYPE_TO_TYPE[this.fieldType];
	}

	get editIcon() {
		return this.isEdit ? "utility:close" : "utility:edit";
	}

	handleEdit() {
		this.isEdit = !this.isEdit;

		this.dispatchEvent(
			new CustomEvent(this.isEdit === false ? "canceledit" : "editrecord", {
				detail: {
					recordId: this.record.Id,
					fieldName: this.col.fieldName,
					value: this.value,
				},
			})
		);
	}

	handleChange(e) {
		this.dispatchEvent(
			new CustomEvent("editrecord", {
				detail: {
					recordId: this.record.Id,
					value: e.detail.value,
					fieldName: this.col.fieldName,
				},
			})
		);
	}
}

export default TableRow;
