from app.utils.excel_generator import ExcelGenerator
from typing import Dict, Any, List


class InvoiceTemplate:
    """Professional invoice template with complete data display"""

    @staticmethod
    def generate(data: Dict[str, Any], generator: ExcelGenerator) -> ExcelGenerator:
        """Generate a beautifully formatted invoice with all data"""
        ws = generator.ws

        # Set column widths
        generator.set_column_width('A', 8)   # S.N
        generator.set_column_width('B', 35)  # Items
        generator.set_column_width('C', 12)  # Quantity
        generator.set_column_width('D', 15)  # Price per Unit
        generator.set_column_width('E', 15)  # Total

        # Title - INVOICE
        generator.merge_and_write(
            'A1', 'E1', 'INVOICE',
            font=generator.create_font(bold=True, size=24),
            alignment=generator.create_alignment(horizontal='center', vertical='center')
        )

        # Company/Vendor Information (Top)
        row = 3
        # Try multiple possible field names for vendor/company
        vendor_name = (
            data.get('vendor_name') or
            data.get('supplier_name') or
            data.get('company_name') or
            data.get('store_name') or
            data.get('business_name') or
            data.get('seller_name') or
            data.get('from_company') or
            ''
        )

        # If still not found, check nested objects
        if not vendor_name:
            # Check vendor_info
            vendor_info_obj = data.get('vendor_info', data.get('supplier_info', {}))
            if isinstance(vendor_info_obj, dict):
                vendor_name = (
                    vendor_info_obj.get('name') or
                    vendor_info_obj.get('company_name') or
                    vendor_info_obj.get('business_name') or
                    ''
                )

            # Check invoice_details
            if not vendor_name and 'invoice_details' in data:
                invoice_details = data.get('invoice_details', {})
                if isinstance(invoice_details, dict):
                    vendor_name = (
                        invoice_details.get('vendor_name') or
                        invoice_details.get('from') or
                        invoice_details.get('issued_by') or
                        ''
                    )

        if vendor_name:
            generator.merge_and_write(f'A{row}', f'E{row}', vendor_name,
                                     font=generator.create_font(bold=True, size=14),
                                     alignment=generator.create_alignment(horizontal='center'))
            row += 1

        # Vendor contact info
        vendor_info = data.get('vendor_info', data.get('supplier_info', {}))
        if isinstance(vendor_info, dict):
            vendor_address = vendor_info.get('address', data.get('vendor_address', ''))
            vendor_phone = vendor_info.get('phone', data.get('vendor_phone', ''))
            vendor_email = vendor_info.get('email', data.get('vendor_email', ''))
        else:
            vendor_address = data.get('vendor_address', '')
            vendor_phone = data.get('vendor_phone', '')
            vendor_email = data.get('vendor_email', '')

        if vendor_address:
            generator.merge_and_write(f'A{row}', f'E{row}', vendor_address,
                                     alignment=generator.create_alignment(horizontal='center'))
            row += 1
        if vendor_phone:
            generator.merge_and_write(f'A{row}', f'E{row}', vendor_phone,
                                     alignment=generator.create_alignment(horizontal='center'))
            row += 1
        if vendor_email:
            generator.merge_and_write(f'A{row}', f'E{row}', vendor_email,
                                     alignment=generator.create_alignment(horizontal='center'))
            row += 1

        row += 1  # Spacing

        # Invoice details on LEFT side (Column A)
        generator.write_cell(f'A{row}', 'DATE:',
                           font=generator.create_font(bold=True))
        generator.write_cell(f'B{row}', generator.format_date(data.get('date', '')))

        row += 1
        invoice_num = data.get('invoice_number', data.get('invoice_id', data.get('invoice_no', '')))
        if invoice_num:
            generator.write_cell(f'A{row}', 'INVOICE #:',
                               font=generator.create_font(bold=True))
            generator.write_cell(f'B{row}', str(invoice_num))
            row += 1

        # Customer/Bill To information
        generator.write_cell(f'A{row}', 'BILL TO:',
                           font=generator.create_font(bold=True))
        generator.write_cell(f'B{row}', data.get('customer_name', ''))
        row += 1

        # Customer details
        customer_info = data.get('customer_info', {})
        if isinstance(customer_info, dict):
            customer_address = customer_info.get('address', '')
            customer_phone = customer_info.get('phone', '')
            customer_email = customer_info.get('email', '')
        else:
            customer_address = data.get('customer_address', '')
            customer_phone = data.get('customer_phone', '')
            customer_email = data.get('customer_email', '')

        if customer_address:
            generator.write_cell(f'A{row}', 'Address:',
                               font=generator.create_font(bold=True))
            generator.write_cell(f'B{row}', customer_address)
            row += 1
        if customer_phone:
            generator.write_cell(f'A{row}', 'Phone:',
                               font=generator.create_font(bold=True))
            generator.write_cell(f'B{row}', customer_phone)
            row += 1
        if customer_email:
            generator.write_cell(f'A{row}', 'Email:',
                               font=generator.create_font(bold=True))
            generator.write_cell(f'B{row}', customer_email)
            row += 1

        row += 1  # Spacing before table

        # Table header: S.N | Items | Quantity | Price per Unit | Total
        header_fill = generator.create_fill('E7E6E6')
        border = generator.create_border()

        generator.write_cell(f'A{row}', 'S.N',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='center'),
                           fill=header_fill, border=border)
        generator.write_cell(f'B{row}', 'ITEMS',
                           font=generator.create_font(bold=True),
                           fill=header_fill, border=border)
        generator.write_cell(f'C{row}', 'QUANTITY',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='center'),
                           fill=header_fill, border=border)
        generator.write_cell(f'D{row}', 'PRICE PER UNIT',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='right'),
                           fill=header_fill, border=border)
        generator.write_cell(f'E{row}', 'TOTAL',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='right'),
                           fill=header_fill, border=border)

        # Line items
        items = data.get('line_items', data.get('items', []))
        if not items and 'item_description' in data:
            # Single item invoice
            items = [{
                'description': data.get('item_description', ''),
                'quantity': data.get('quantity', 1),
                'price': data.get('price', data.get('total_amount', 0)),
                'total': data.get('total_amount', 0)
            }]

        row += 1
        sn = 1

        if items and isinstance(items, list):
            for item in items:
                if isinstance(item, dict):
                    desc = item.get('description', item.get('item', item.get('name', '')))
                    quantity = item.get('quantity', item.get('qty', 1))
                    price = item.get('price', item.get('unit_price', item.get('rate', 0)))
                    total = item.get('total', item.get('amount', price * quantity if price and quantity else 0))

                    generator.write_cell(f'A{row}', str(sn),
                                       alignment=generator.create_alignment(horizontal='center'),
                                       border=border)
                    generator.write_cell(f'B{row}', desc, border=border)
                    generator.write_cell(f'C{row}', str(quantity),
                                       alignment=generator.create_alignment(horizontal='center'),
                                       border=border)
                    generator.write_cell(f'D{row}', generator.format_currency(price),
                                       alignment=generator.create_alignment(horizontal='right'),
                                       border=border)
                    generator.write_cell(f'E{row}', generator.format_currency(total),
                                       alignment=generator.create_alignment(horizontal='right'),
                                       border=border)
                    row += 1
                    sn += 1

        # Totals section
        row += 1
        subtotal = data.get('subtotal', data.get('total_amount', 0))
        tax_rate = data.get('tax_rate', 0)
        tax = data.get('tax', data.get('sales_tax', 0))
        other = data.get('other', data.get('other_charges', 0))
        total = data.get('total_amount', data.get('total', 0))

        generator.write_cell(f'D{row}', 'SUBTOTAL:',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='right'))
        generator.write_cell(f'E{row}', generator.format_currency(subtotal),
                           alignment=generator.create_alignment(horizontal='right'))

        row += 1
        generator.write_cell(f'D{row}', 'TAX RATE:',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='right'))
        generator.write_cell(f'E{row}', f'{tax_rate}%' if tax_rate else '0.00%',
                           alignment=generator.create_alignment(horizontal='right'))

        row += 1
        generator.write_cell(f'D{row}', 'SALES TAX:',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='right'))
        generator.write_cell(f'E{row}', generator.format_currency(tax),
                           alignment=generator.create_alignment(horizontal='right'))

        if other:
            row += 1
            generator.write_cell(f'D{row}', 'OTHER:',
                               font=generator.create_font(bold=True),
                               alignment=generator.create_alignment(horizontal='right'))
            generator.write_cell(f'E{row}', generator.format_currency(other),
                               alignment=generator.create_alignment(horizontal='right'))

        row += 1
        generator.write_cell(f'D{row}', 'TOTAL:',
                           font=generator.create_font(bold=True, size=12),
                           alignment=generator.create_alignment(horizontal='right'),
                           fill=generator.create_fill('E7E6E6'))
        generator.write_cell(f'E{row}', generator.format_currency(total),
                           font=generator.create_font(bold=True, size=12),
                           alignment=generator.create_alignment(horizontal='right'),
                           fill=generator.create_fill('E7E6E6'))

        # Footer notes
        row += 2
        payment_note = data.get('payment_instructions', f'Make all checks payable to {vendor_name}.')
        generator.merge_and_write(f'A{row}', f'E{row}', payment_note,
                                 font=generator.create_font(size=9))

        row += 1
        generator.merge_and_write(f'A{row}', f'E{row}', 'THANK YOU FOR YOUR BUSINESS!',
                                 font=generator.create_font(bold=True, size=11),
                                 alignment=generator.create_alignment(horizontal='center'))

        return generator



class ReceiptTemplate:
    """Receipt template with complete data display"""

    @staticmethod
    def generate(data: Dict[str, Any], generator: ExcelGenerator) -> ExcelGenerator:
        """Generate a receipt format with all data"""
        # Set column widths
        generator.set_column_width('A', 8)   # S.N
        generator.set_column_width('B', 35)  # Items
        generator.set_column_width('C', 12)  # Quantity
        generator.set_column_width('D', 15)  # Price per Unit
        generator.set_column_width('E', 15)  # Total

        # Title
        generator.merge_and_write(
            'A1', 'E1', 'RECEIPT',
            font=generator.create_font(bold=True, size=20),
            alignment=generator.create_alignment(horizontal='center')
        )

        # Store/Vendor info
        row = 3
        vendor_name = data.get('vendor_name', data.get('store_name', ''))
        if vendor_name:
            generator.merge_and_write(f'A{row}', f'E{row}', vendor_name,
                                     font=generator.create_font(bold=True, size=14),
                                     alignment=generator.create_alignment(horizontal='center'))
            row += 1

        store_info = data.get('store_info', data.get('vendor_info', {}))
        if isinstance(store_info, dict):
            address = store_info.get('address', data.get('vendor_address', ''))
            phone = store_info.get('phone', data.get('vendor_phone', ''))
        else:
            address = data.get('vendor_address', '')
            phone = data.get('vendor_phone', '')

        if address:
            generator.merge_and_write(f'A{row}', f'E{row}', address,
                                     alignment=generator.create_alignment(horizontal='center'))
            row += 1
        if phone:
            generator.merge_and_write(f'A{row}', f'E{row}', phone,
                                     alignment=generator.create_alignment(horizontal='center'))
            row += 1

        # Receipt details on LEFT
        row += 1
        generator.write_cell(f'A{row}', 'DATE:',
                           font=generator.create_font(bold=True))
        generator.write_cell(f'B{row}', generator.format_date(data.get('date', '')))

        row += 1
        receipt_num = data.get('receipt_number', data.get('receipt_id', ''))
        if receipt_num:
            generator.write_cell(f'A{row}', 'RECEIPT #:',
                               font=generator.create_font(bold=True))
            generator.write_cell(f'B{row}', str(receipt_num))
            row += 1

        row += 1  # Spacing

        # Table header
        header_fill = generator.create_fill('E7E6E6')
        border = generator.create_border()

        generator.write_cell(f'A{row}', 'S.N',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='center'),
                           fill=header_fill, border=border)
        generator.write_cell(f'B{row}', 'ITEMS',
                           font=generator.create_font(bold=True),
                           fill=header_fill, border=border)
        generator.write_cell(f'C{row}', 'QUANTITY',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='center'),
                           fill=header_fill, border=border)
        generator.write_cell(f'D{row}', 'PRICE PER UNIT',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='right'),
                           fill=header_fill, border=border)
        generator.write_cell(f'E{row}', 'TOTAL',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='right'),
                           fill=header_fill, border=border)

        # Items
        items = data.get('items', data.get('line_items', []))
        row += 1
        sn = 1

        if items and isinstance(items, list):
            for item in items:
                if isinstance(item, dict):
                    desc = item.get('description', item.get('item', item.get('name', '')))
                    quantity = item.get('quantity', item.get('qty', 1))
                    price = item.get('price', item.get('unit_price', 0))
                    total = item.get('total', item.get('amount', price * quantity if price and quantity else 0))

                    generator.write_cell(f'A{row}', str(sn),
                                       alignment=generator.create_alignment(horizontal='center'),
                                       border=border)
                    generator.write_cell(f'B{row}', desc, border=border)
                    generator.write_cell(f'C{row}', str(quantity),
                                       alignment=generator.create_alignment(horizontal='center'),
                                       border=border)
                    generator.write_cell(f'D{row}', generator.format_currency(price),
                                       alignment=generator.create_alignment(horizontal='right'),
                                       border=border)
                    generator.write_cell(f'E{row}', generator.format_currency(total),
                                       alignment=generator.create_alignment(horizontal='right'),
                                       border=border)
                    row += 1
                    sn += 1

        # Total
        row += 1
        total = data.get('total_amount', data.get('total', 0))
        generator.write_cell(f'D{row}', 'TOTAL:',
                           font=generator.create_font(bold=True, size=12),
                           alignment=generator.create_alignment(horizontal='right'),
                           fill=generator.create_fill('E7E6E6'))
        generator.write_cell(f'E{row}', generator.format_currency(total),
                           font=generator.create_font(bold=True, size=12),
                           alignment=generator.create_alignment(horizontal='right'),
                           fill=generator.create_fill('E7E6E6'))

        # Payment method
        row += 2
        payment_method = data.get('payment_method', '')
        if payment_method:
            generator.merge_and_write(f'A{row}', f'E{row}', f'Payment Method: {payment_method}',
                                     alignment=generator.create_alignment(horizontal='center'))

        return generator



class BankStatementTemplate:
    """Bank statement template with complete transaction data"""

    @staticmethod
    def generate(data: Dict[str, Any], generator: ExcelGenerator) -> ExcelGenerator:
        """Generate a bank statement format"""

        # Set column widths
        generator.set_column_width('A', 15)  # Date
        generator.set_column_width('B', 40)  # Description
        generator.set_column_width('C', 15)  # Debit
        generator.set_column_width('D', 15)  # Credit
        generator.set_column_width('E', 15)  # Balance

        # Title
        generator.merge_and_write(
            'A1', 'E1', 'BANK STATEMENT',
            font=generator.create_font(bold=True, size=20),
            alignment=generator.create_alignment(horizontal='center')
        )

        # Bank info
        row = 3
        bank_name = data.get('bank_name', '')
        if bank_name:
            generator.merge_and_write(f'A{row}', f'E{row}', bank_name,
                                     font=generator.create_font(bold=True, size=14),
                                     alignment=generator.create_alignment(horizontal='center'))
            row += 1

        # Account details on LEFT
        row += 1
        account_number = data.get('account_number', '')
        if account_number:
            generator.write_cell(f'A{row}', 'ACCOUNT #:',
                               font=generator.create_font(bold=True))
            generator.write_cell(f'B{row}', str(account_number))
            row += 1

        account_holder = data.get('account_holder', data.get('customer_name', ''))
        if account_holder:
            generator.write_cell(f'A{row}', 'ACCOUNT HOLDER:',
                               font=generator.create_font(bold=True))
            generator.write_cell(f'B{row}', account_holder)
            row += 1

        statement_period = data.get('statement_period', '')
        if statement_period:
            generator.write_cell(f'A{row}', 'PERIOD:',
                               font=generator.create_font(bold=True))
            generator.write_cell(f'B{row}', statement_period)
            row += 1

        row += 1  # Spacing

        # Table header
        header_fill = generator.create_fill('E7E6E6')
        border = generator.create_border()

        generator.write_cell(f'A{row}', 'DATE',
                           font=generator.create_font(bold=True),
                           fill=header_fill, border=border)
        generator.write_cell(f'B{row}', 'DESCRIPTION',
                           font=generator.create_font(bold=True),
                           fill=header_fill, border=border)
        generator.write_cell(f'C{row}', 'DEBIT',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='right'),
                           fill=header_fill, border=border)
        generator.write_cell(f'D{row}', 'CREDIT',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='right'),
                           fill=header_fill, border=border)
        generator.write_cell(f'E{row}', 'BALANCE',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='right'),
                           fill=header_fill, border=border)

        # Transactions
        transactions = data.get('transactions', [])
        row += 1

        if transactions and isinstance(transactions, list):
            for txn in transactions:
                if isinstance(txn, dict):
                    generator.write_cell(f'A{row}', generator.format_date(txn.get('date', '')),
                                       border=border)
                    generator.write_cell(f'B{row}', txn.get('description', ''),
                                       border=border)
                    generator.write_cell(f'C{row}', generator.format_currency(txn.get('debit', 0)),
                                       alignment=generator.create_alignment(horizontal='right'),
                                       border=border)
                    generator.write_cell(f'D{row}', generator.format_currency(txn.get('credit', 0)),
                                       alignment=generator.create_alignment(horizontal='right'),
                                       border=border)
                    generator.write_cell(f'E{row}', generator.format_currency(txn.get('balance', 0)),
                                       alignment=generator.create_alignment(horizontal='right'),
                                       border=border)
                    row += 1

        # Final balance
        row += 1
        final_balance = data.get('final_balance', data.get('closing_balance', 0))
        generator.write_cell(f'D{row}', 'FINAL BALANCE:',
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='right'),
                           fill=generator.create_fill('E7E6E6'))
        generator.write_cell(f'E{row}', generator.format_currency(final_balance),
                           font=generator.create_font(bold=True),
                           alignment=generator.create_alignment(horizontal='right'),
                           fill=generator.create_fill('E7E6E6'))

        return generator


class GenericTemplate:
    """Generic template for other document types"""

    @staticmethod
    def generate(data: Dict[str, Any], generator: ExcelGenerator) -> ExcelGenerator:
        """Generate a generic formatted document with all data"""

        # Set column widths
        generator.set_column_width('A', 30)
        generator.set_column_width('B', 50)

        # Title
        doc_type = data.get('document_type', 'Document').upper()
        generator.merge_and_write(
            'A1', 'B1', doc_type,
            font=generator.create_font(bold=True, size=18),
            alignment=generator.create_alignment(horizontal='center')
        )

        # Exclude internal fields
        exclude_fields = [
            'company_id', 'image_url', 'document_key',
            'user_id', 'created_at', 'document_type'
        ]

        row = 3
        border = generator.create_border()

        # Header
        generator.write_cell(f'A{row}', 'FIELD',
                           font=generator.create_font(bold=True),
                           fill=generator.create_fill('E7E6E6'),
                           border=border)
        generator.write_cell(f'B{row}', 'VALUE',
                           font=generator.create_font(bold=True),
                           fill=generator.create_fill('E7E6E6'),
                           border=border)

        row += 1

        # Flatten and display all data
        def flatten_dict(d, parent_key='', sep='_'):
            items = []
            for k, v in d.items():
                new_key = f"{parent_key}{sep}{k}" if parent_key else k
                if isinstance(v, dict):
                    items.extend(flatten_dict(v, new_key, sep=sep).items())
                elif isinstance(v, list):
                    items.append((new_key, ', '.join(map(str, v))))
                else:
                    items.append((new_key, v))
            return dict(items)

        flattened = flatten_dict(data)

        for key, value in sorted(flattened.items()):
            if key not in exclude_fields:
                generator.write_cell(f'A{row}', key.replace('_', ' ').title(),
                                   font=generator.create_font(bold=True),
                                   border=border)
                generator.write_cell(f'B{row}', str(value),
                                   border=border)
                row += 1

        return generator


class ExcelTemplateFactory:
    """Factory to select appropriate template based on document type"""

    @staticmethod
    def generate_excel(data: Dict[str, Any]) -> bytes:
        """
        Generate Excel file based on document type

        Args:
            data: Document data dictionary

        Returns:
            Excel file as bytes
        """
        generator = ExcelGenerator()
        generator.create_workbook()

        doc_type = data.get('document_type', '').lower()

        # Select template based on document type
        if 'invoice' in doc_type:
            InvoiceTemplate.generate(data, generator)
        elif 'receipt' in doc_type:
            ReceiptTemplate.generate(data, generator)
        elif 'bank' in doc_type or 'statement' in doc_type:
            BankStatementTemplate.generate(data, generator)
        else:
            GenericTemplate.generate(data, generator)

        return generator.get_bytes()

