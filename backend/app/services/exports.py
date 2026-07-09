import csv
import io

class ExportsService:
    @classmethod
    def export_csv(cls, headers: list, rows: list) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        writer.writerows(rows)
        return output.getvalue()

    @classmethod
    def export_excel(cls, headers: list, rows: list) -> str:
        # Mock XML-based spreadsheet format or basic Tab Separated representation
        output = io.StringIO()
        output.write("XML SpreadSheet Mock\n")
        output.write("\t".join(headers) + "\n")
        for r in rows:
            output.write("\t".join(map(str, r)) + "\n")
        return output.getvalue()

    @classmethod
    def export_pdf(cls, title: str, headers: list, rows: list) -> str:
        # Mock PDF template representation
        output = io.StringIO()
        output.write(f"--- PDF REPORT: {title.upper()} ---\n\n")
        output.write(" | ".join(headers) + "\n")
        output.write("-" * 50 + "\n")
        for r in rows:
            output.write(" | ".join(map(str, r)) + "\n")
        return output.getvalue()
