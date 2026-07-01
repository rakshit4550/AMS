// import React, { useEffect, useState } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import {
//   fetchAccounts,
//   createAccount,
//   updateAccount,
//   deleteAccount,
//   fetchParties,
//   verifyAccount,
//   sendStatementEmail,
//   importAccounts,
//   toggleAutoJob,
// } from "../redux/accountSlice";
// import { jsPDF } from "jspdf";
// import Select from "react-select";
// import {
//   FaPlus,
//   FaEdit,
//   FaTrash,
//   FaCheck,
//   FaFileDownload,
//   FaArrowRight,
//   FaEnvelope,
//   FaUpload,
// } from "react-icons/fa";

// // Utility function to format numbers with commas
// const formatNumber = (number) => {
//   if (number === undefined || number === null || isNaN(number)) return "0";
//   return Number(number).toLocaleString("en-IN");
// };

// // Utility function to remove commas for raw number
// const parseNumber = (value) => {
//   return value.replace(/,/g, "");
// };

// // Utility function to format dates
// const formatDate = (date) => {
//   if (!date || isNaN(new Date(date))) return "N/A";
//   const options = { day: "numeric", month: "short", year: "numeric" };
//   return new Date(date).toLocaleDateString("en-GB", options);
// };

// // Utility function to get clean remark
// const getCleanRemark = (account, parties) => {
//   let r = account.remark || "";
//   if (r) {
//     // If it ends with (Transfer to/from ...), remove it
//     const match = r.match(/^(.*)\s*\(Transfer (to|from) [^)]+\)$/);
//     if (match) {
//       r = match[1].trim();
//     }
//     return r;
//   } else {
//     // fallback
//     if (account.debit > 0 && account.to) {
//       const toPartyName =
//         parties.find((p) => p._id === account.to)?.partyname || "Unknown";
//       return `Transfer to ${toPartyName}`;
//     } else if (account.credit > 0 && account.from) {
//       const fromPartyName =
//         parties.find((p) => p._id === account.from)?.partyname || "Unknown";
//       return `Transfer from ${fromPartyName}`;
//     }
//   }
//   return "";
// };

// const Account = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { accounts, parties, loading, error, autoJobEnabled } = useSelector(
//     (state) => state.account,
//   );
//   const [formData, setFormData] = useState({
//     partyname: "",
//     amount: "",
//     transactionType: "debit",
//     remark: "",
//     date: new Date().toISOString().split("T")[0],
//     toParty: "",
//   });
//   const [editId, setEditId] = useState(null);
//   const [entriesPerPage, setEntriesPerPage] = useState(10);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageInput, setPageInput] = useState("");
//   const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
//   const [showPdfPreview, setShowPdfPreview] = useState(false);
//   const [pdfFileName, setPdfFileName] = useState("");
//   const API_URL = process.env.REACT_APP_API_URL;

//   const partyOptions = [
//     { value: "", label: "Select a Party" },
//     ...parties.map((party) => ({ value: party._id, label: party.partyname })),
//   ];

//   const entriesPerPageOptions = [
//     { value: 10, label: "10" },
//     { value: 20, label: "20" },
//     { value: 30, label: "30" },
//     { value: 50, label: "50" },
//     { value: 100, label: "100" },
//   ];

//   useEffect(() => {
//     dispatch(fetchParties())
//       .unwrap()
//       .catch((err) => {
//         if (err === "No token available" || err.includes("Invalid token")) {
//           navigate("/");
//         }
//       });
//     dispatch(fetchAccounts())
//       .unwrap()
//       .catch((err) => {
//         if (err === "No token available" || err.includes("Invalid token")) {
//           navigate("/");
//         }
//       });
//     // Fetch initial autoJobEnabled state from token
//     const token = localStorage.getItem("token");
//     if (token) {
//       try {
//         const decoded = JSON.parse(atob(token.split(".")[1]));
//         dispatch({
//           type: "account/toggleAutoJob/fulfilled",
//           payload: { autoJobEnabled: decoded.autoJobEnabled || false },
//         });
//       } catch (err) {
//         console.error("Error decoding token:", err);
//       }
//     }
//   }, [dispatch, navigate]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     if (name === "amount") {
//       // Remove non-numeric characters except for decimal point
//       const numericValue = value.replace(/[^0-9.]/g, "");
//       // Ensure only one decimal point
//       const parts = numericValue.split(".");
//       const num = parts[0];
//       const integerPart = num === "" ? "" : Number(num).toLocaleString("en-IN");
//       let formattedValue = integerPart;
//       if (parts.length > 1) {
//         formattedValue += "." + parts[1].slice(0, 2); // Limit to 2 decimal places
//       }
//       setFormData({ ...formData, [name]: formattedValue });
//     } else {
//       setFormData({ ...formData, [name]: value });
//     }
//   };

//   const handlePartyInputChange = (selectedOption) => {
//     const partyname = selectedOption ? selectedOption.value : "";
//     const transactionType = formData.toParty ? "transfer" : "credit";
//     setFormData({ ...formData, partyname, transactionType });
//     setCurrentPage(1);
//   };

//   const handleToPartyInputChange = (selectedOption) => {
//     const toParty = selectedOption ? selectedOption.value : "";
//     setFormData((prev) => ({
//       ...prev,
//       toParty,
//       transactionType: toParty ? "transfer" : "credit",
//     }));
//   };

//   const handleEntriesPerPageChange = (selectedOption) => {
//     setEntriesPerPage(selectedOption.value);
//     setCurrentPage(1);
//   };

//   const handlePageInputChange = (e) => {
//     setPageInput(e.target.value);
//   };

//   const handleGoToPage = () => {
//     const pageNumber = parseInt(pageInput, 10);
//     if (pageNumber >= 1 && pageNumber <= totalPages && !isNaN(pageNumber)) {
//       setCurrentPage(pageNumber);
//       setPageInput("");
//     } else {
//       alert("Please enter a valid page number");
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.partyname || !formData.amount || !formData.date) {
//       alert("Party name, amount, and date are required");
//       return;
//     }
//     const accountData = {
//       partyname: formData.partyname,
//       credit:
//         formData.transactionType === "credit"
//           ? parseFloat(parseNumber(formData.amount))
//           : formData.transactionType === "transfer"
//             ? 0
//             : 0,
//       debit:
//         formData.transactionType === "debit"
//           ? parseFloat(parseNumber(formData.amount))
//           : formData.transactionType === "transfer"
//             ? parseFloat(parseNumber(formData.amount))
//             : 0,
//       remark: formData.remark,
//       date: formData.date,
//       to: formData.toParty || undefined,
//     };
//     try {
//       if (editId) {
//         await dispatch(updateAccount({ id: editId, ...accountData })).unwrap();
//         showMessages(accountData.credit, accountData.debit, formData.partyname);
//         await dispatch(fetchAccounts()).unwrap();
//         setFormData({
//           partyname: formData.partyname,
//           amount: "",
//           transactionType: formData.toParty ? "transfer" : "credit",
//           remark: "",
//           date: formData.date,
//           toParty: formData.toParty,
//         });
//         setEditId(null);
//       } else {
//         const result = await dispatch(createAccount(accountData)).unwrap();
//         showMessages(accountData.credit, accountData.debit, formData.partyname);
//         await dispatch(fetchAccounts()).unwrap();
//       }
//     } catch (err) {
//       if (err === "No token available" || err.includes("Invalid token")) {
//         navigate("/");
//       } else {
//         alert("Error creating/updating account: " + err);
//       }
//     }
//   };

//   const showMessages = (credit, debit, partyId) => {
//     const selectedParty = parties.find((p) => p._id === partyId);
//     const partyName = selectedParty ? selectedParty.partyname : "this party";
//   };

//   const handleEdit = (account) => {
//     // Verified account ko bhi edit/update allow kiya hai.
//     // Delete verified account abhi bhi blocked rahega.
//     const transactionType =
//       account.credit > 0
//         ? "credit"
//         : account.debit > 0 && account.to
//           ? "transfer"
//           : "debit";
//     setFormData({
//       partyname: account.partyname._id,
//       amount: formatNumber(account.credit > 0 ? account.credit : account.debit),
//       transactionType,
//       remark: account.remark || "",
//       date: new Date(account.date).toISOString().split("T")[0],
//       toParty: account.to || "",
//     });
//     setEditId(account._id);
//   };

//   const handleDelete = (id) => {
//     const account = accounts.find((acc) => acc._id === id);
//     if (account.verified) {
//       alert("This account is verified and cannot be deleted.");
//       return;
//     }
//     if (!window.confirm("Are you sure you want to delete this account?")) {
//       return;
//     }
//     dispatch(deleteAccount(id))
//       .unwrap()
//       .then(() => {
//         dispatch(fetchAccounts());
//       })
//       .catch((err) => {
//         if (err === "No token available" || err.includes("Invalid token")) {
//           navigate("/");
//         }
//       });
//   };

//   const handleVerify = (id) => {
//     dispatch(verifyAccount(id))
//       .unwrap()
//       .then(() => {
//         dispatch(fetchAccounts());
//       })
//       .catch((err) => {
//         if (err === "No token available" || err.includes("Invalid token")) {
//           navigate("/");
//         }
//       });
//   };

//   const handleDownload = async () => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       navigate("/");
//       return;
//     }
//     if (!formData.partyname) {
//       alert("Please select a party to download the statement.");
//       return;
//     }
//     let url = `${API_URL}/accounts/statement/download`;
//     if (formData.partyname) {
//       url += `?party=${formData.partyname}`;
//     }
//     try {
//       const response = await fetch(url, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const contentType = response.headers.get("content-type");
//       if (!contentType || !contentType.includes("application/json")) {
//         throw new Error(
//           "Invalid response: Expected JSON data, but received binary (e.g., PDF). Check backend.",
//         );
//       }
//       const grouped = await response.json();
//       if (
//         !grouped ||
//         typeof grouped !== "object" ||
//         Object.keys(grouped).length === 0
//       ) {
//         throw new Error("Invalid or empty data received from server");
//       }
//       Object.keys(grouped).forEach((pId) => {
//         const doc = new jsPDF();
//         let y = 20;
//         let page = 1;
//         const group = grouped[pId];
//         if (!group || !group.accounts || group.accounts.length === 0) {
//           return;
//         }
//         const party = parties.find((p) => p._id === pId);
//         if (!party) {
//           return;
//         }
//         // Header
//         doc.setFillColor(0, 51, 102);
//         doc.rect(0, 0, 210, 15, "F");
//         doc.setTextColor(255, 255, 255);
//         doc.setFontSize(14);
//         doc.setFont("times", "bold");
//         doc.text(`${party.partyname} Statement`, 10, 10);
//         doc.setFontSize(12);
//         doc.setTextColor(0, 0, 0);
//         doc.setFont("times", "normal");
//         y += 10;

//         // Calculate balance
//         const balance = (group.totalDebit || 0) - (group.totalCredit || 0);
//         const balSign = balance > 0 ? "Dr" : balance < 0 ? "Cr" : "";
//         const balValue = formatNumber(Math.abs(balance));
//         const balanceTextColor = balSign === "Cr" ? [0, 128, 0] : [255, 0, 0]; // Green for Cr, Red for Dr

//         // Closing Balance Box (Right Side, Above Table)
//         const boxX = 130;
//         const boxWidth = 70;
//         const boxHeight = 20;
//         const bgColor =
//           balance > 0
//             ? [255, 200, 200]
//             : balance < 0
//               ? [200, 255, 200]
//               : [240, 240, 240];
//         doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
//         doc.rect(boxX, y, boxWidth, boxHeight, "F");
//         doc.setDrawColor(150, 150, 150);
//         doc.rect(boxX, y, boxWidth, boxHeight);
//         doc.setFontSize(12);
//         doc.setFont("times", "bold");
//         doc.setTextColor(
//           balanceTextColor[0],
//           balanceTextColor[1],
//           balanceTextColor[2],
//         );
//         doc.text("Closing Balance", boxX + 5, y + 8);
//         doc.setFont("times", "normal");
//         doc.setTextColor(
//           balanceTextColor[0],
//           balanceTextColor[1],
//           balanceTextColor[2],
//         );
//         doc.text(`Rs. ${balValue} ${balSign}`, boxX + 5, y + 16);
//         y += 25;

//         // Table setup
//         const tableX = 10;
//         const tableWidth = 190;
//         const colWidths = [35, 35, 35, 35, 50]; // Adjusted widths: reduced Date, Debit, Credit, Balance; increased Remark
//         const baseRowHeight = 8;
//         const tableStartY = y;

//         // Table header
//         doc.setFillColor(0, 51, 102);
//         doc.rect(tableX, y, tableWidth, baseRowHeight, "F");
//         doc.setTextColor(150, 150, 150);
//         doc.setFontSize(10);
//         doc.setFont("times", "bold");
//         doc.text("Date", tableX + 2, y + 6);
//         doc.text("Debit (-)", tableX + 37, y + 6);
//         doc.text("Credit (+)", tableX + 72, y + 6);
//         doc.text("Balance", tableX + 107, y + 6);
//         doc.text("Remark", tableX + 142, y + 6);
//         y += baseRowHeight;
//         doc.setFont("times", "normal");
//         doc.setTextColor(0, 0, 0);

//         // Filter and sort accounts for PDF
//         const validAccounts = group.accounts
//           .filter((acc) => acc && acc.date && !isNaN(new Date(acc.date)))
//           .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//         if (validAccounts.length === 0) {
//           doc.setFontSize(10);
//           doc.setTextColor(255, 0, 0);
//           doc.text(
//             "No valid accounts available for this party.",
//             tableX,
//             y + 10,
//           );
//           const pdfBlob = doc.output("blob");
//           const pdfUrl = URL.createObjectURL(pdfBlob);

//           setPdfPreviewUrl(pdfUrl);
//           setPdfFileName(`${partyName}_account_statement.pdf`);
//           setShowPdfPreview(true);
//           return;
//         }

//         // Create reverse sorted accounts for balance calculation
//         const reverseSortedAccounts = [...validAccounts].sort(
//           (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
//         );

//         validAccounts.forEach((acc, rowIndex) => {
//           // Reverse balance calculation
//           const reverseIndex = validAccounts.length - rowIndex - 1;
//           let currentBalance = 0;
//           const accountsUpToReverseIndex = reverseSortedAccounts.slice(
//             0,
//             reverseIndex + 1,
//           );
//           accountsUpToReverseIndex.forEach((acc) => {
//             currentBalance += (acc.debit || 0) - (acc.credit || 0);
//           });
//           const curBalSign =
//             currentBalance > 0 ? "Dr" : currentBalance < 0 ? "Cr" : "";
//           const curBalValue = formatNumber(Math.abs(currentBalance));
//           const currentBalanceTextColor =
//             curBalSign === "Cr" ? [0, 128, 0] : [255, 0, 0];

//           // Handle remark and calculate dynamic row height
//           const remarkText = getCleanRemark(acc, parties);
//           const maxWidth = colWidths[4] - 4; // Adjust for padding
//           const splitText = doc.splitTextToSize(remarkText, maxWidth);
//           const textHeight = splitText.length * 5; // Approximate height per line (5 units per line)
//           const rowHeight = Math.max(baseRowHeight, textHeight);

//           // Draw row background if even
//           if (rowIndex % 2 === 0) {
//             doc.setFillColor(240, 240, 240);
//             doc.rect(tableX, y, tableWidth, rowHeight, "F");
//           }

//           // Draw single row border for the entire table row
//           doc.setDrawColor(150, 150, 150);
//           doc.rect(tableX, y, tableWidth, rowHeight);

//           let x = tableX;
//           let lineY = y + 6; // Starting y-position for text
//           colWidths.forEach((width, i) => {
//             if (i === 0) doc.text(formatDate(acc.date), x + 2, lineY);
//             if (i === 1 && (acc.debit || 0) > 0) {
//               doc.setTextColor(255, 0, 0);
//               doc.text(formatNumber(acc.debit || 0), x + 2, lineY);
//               doc.setTextColor(0, 0, 0);
//             }
//             if (i === 2 && (acc.credit || 0) > 0) {
//               doc.setTextColor(0, 128, 0);
//               doc.text(formatNumber(acc.credit || 0), x + 2, lineY);
//               doc.setTextColor(0, 0, 0);
//             }
//             if (i === 3) {
//               doc.setTextColor(
//                 currentBalanceTextColor[0],
//                 currentBalanceTextColor[1],
//                 currentBalanceTextColor[2],
//               );
//               doc.text(`${curBalValue} ${curBalSign}`, x + 2, lineY); // Removed "Rs."
//               doc.setTextColor(0, 0, 0);
//             }
//             if (i === 4) {
//               // Adjust y-position for multi-line text
//               let textY = y + 4; // Start slightly above to center vertically
//               splitText.forEach((line, index) => {
//                 doc.text(line, x + 2, textY + index * 5);
//               });
//             }
//             x += width;
//           });

//           y += rowHeight;

//           // Check if we need a new page
//           if (y > 260 && rowIndex < validAccounts.length - 1) {
//             doc.addPage();
//             y = 20;
//             page++;
//             doc.setFillColor(0, 51, 102);
//             doc.rect(0, 0, 210, 15, "F");
//             doc.setTextColor(255, 255, 255);
//             doc.setFontSize(14);
//             doc.setFont("times", "bold");
//             doc.text(`${party.partyname} Statement`, 10, 10);
//             y += 15;

//             // Closing Balance Box (Right Side, Above Table) - NEW PAGE
//             doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
//             doc.rect(boxX, y, boxWidth, boxHeight, "F");
//             doc.setDrawColor(150, 150, 150);
//             doc.rect(boxX, y, boxWidth, boxHeight);
//             doc.setFontSize(12);
//             doc.setFont("times", "bold");
//             doc.setTextColor(
//               balanceTextColor[0],
//               balanceTextColor[1],
//               balanceTextColor[2],
//             );
//             doc.text("Closing Balance", boxX + 5, y + 8);
//             doc.setFont("times", "normal");
//             doc.setTextColor(
//               balanceTextColor[0],
//               balanceTextColor[1],
//               balanceTextColor[2],
//             );
//             doc.text(`Rs. ${balValue} ${balSign}`, boxX + 5, y + 16);
//             y += 25;

//             doc.setFillColor(0, 51, 102);
//             doc.rect(tableX, y, tableWidth, baseRowHeight, "F");
//             doc.setTextColor(255, 255, 255);
//             doc.setFontSize(10);
//             doc.setFont("times", "bold");
//             doc.text("Date", tableX + 2, y + 6);
//             doc.text("Debit (-)", tableX + 37, y + 6);
//             doc.text("Credit (+)", tableX + 72, y + 6);
//             doc.text("Balance", tableX + 107, y + 6);
//             doc.text("Remark", tableX + 142, y + 6);
//             y += baseRowHeight;
//             doc.setFont("times", "normal");
//             doc.setTextColor(0, 0, 0);
//           }
//         });

//         // Add report generation timestamp
//         y += 15;
//         const now = new Date();
//         const hours = now.getHours() % 12 || 12;
//         const minutes = String(now.getMinutes()).padStart(2, "0");
//         const ampm = now.getHours() >= 12 ? "PM" : "AM";
//         const genDate = formatDate(now).replace(
//           /\d{4}$/,
//           `'${now.getFullYear().toString().slice(2)}`,
//         );
//         const genTime = `${hours}:${minutes} ${ampm} | ${genDate}`;
//         doc.setFontSize(9);
//         doc.setTextColor(100, 100, 100);
//         doc.text(`Report Generated: ${genTime}`, tableX, y);

//         const pdfBlob = doc.output("blob");
//         const pdfUrl = URL.createObjectURL(pdfBlob);

//         setPdfPreviewUrl(pdfUrl);
//         setPdfFileName(`${party.partyname}_account_statement.pdf`);
//         setShowPdfPreview(true);
//       });
//     } catch (error) {
//       alert("Error generating statement: " + error.message);
//     }
//   };

//   const handleFinalDownload = () => {
//     const link = document.createElement("a");
//     link.href = pdfPreviewUrl;
//     link.download = pdfFileName;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);

//     setShowPdfPreview(false);
//   };

//   const handleSendEmail = async () => {
//     try {
//       await dispatch(sendStatementEmail()).unwrap();
//       alert("JSON file sent via email successfully");
//     } catch (err) {
//       // Display the exact error message from the backend
//       const errorMessage = err || "An unknown error occurred";
//       alert(`Error sending email: ${errorMessage}`);
//     }
//   };

//   const handleImport = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     try {
//       await dispatch(importAccounts(file)).unwrap();
//       await dispatch(fetchAccounts()).unwrap();
//       await dispatch(fetchParties()).unwrap();
//       alert("Data imported successfully");
//     } catch (err) {
//       alert("Error importing data: " + err);
//     }
//   };

//   const handleToggleAutoJob = async () => {
//     try {
//       const result = await dispatch(toggleAutoJob()).unwrap();
//       localStorage.setItem("token", result.token); // Update token with new autoJobEnabled state
//       alert(
//         `Daily email job ${result.autoJobEnabled ? "enabled" : "disabled"} successfully`,
//       );
//     } catch (err) {
//       alert("Error toggling auto-job: " + err);
//     }
//   };

//   const groupedAccounts = parties.reduce((acc, party) => {
//     const partyAccounts = accounts.filter(
//       (account) => account.partyname?._id === party._id,
//     );
//     if (
//       partyAccounts.length > 0 &&
//       (party._id === formData.partyname || party._id === formData.toParty)
//     ) {
//       acc[party._id] = {
//         partyname: party.partyname,
//         accounts: partyAccounts,
//       };
//     }
//     return acc;
//   }, {});

//   const selectedPartyAccounts =
//     formData.partyname && groupedAccounts[formData.partyname]
//       ? groupedAccounts[formData.partyname].accounts
//       : [];
//   const sortedAccounts = [...(selectedPartyAccounts || [])]
//     .filter((acc) => acc && acc._id && acc.date && !isNaN(new Date(acc.date)))
//     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//   const totalPages = Math.ceil((sortedAccounts.length || 0) / entriesPerPage);
//   const indexOfLast = currentPage * entriesPerPage;
//   const indexOfFirst = indexOfLast - entriesPerPage;
//   const currentAccounts = sortedAccounts.slice(indexOfFirst, indexOfLast);
//   const totalDebit = (sortedAccounts || []).reduce(
//     (sum, account) => sum + (account.debit || 0),
//     0,
//   );
//   const totalCredit = (sortedAccounts || []).reduce(
//     (sum, account) => sum + (account.credit || 0),
//     0,
//   );
//   const balance = totalDebit - totalCredit;
//   const balSign = balance > 0 ? "D" : balance < 0 ? "C" : "";
//   const balValue = formatNumber(Math.abs(balance));
//   const balanceColor =
//     balance > 0
//       ? "text-red-600"
//       : balance < 0
//         ? "text-green-600"
//         : "text-gray-800";

//   const portalSelectStyles = {
//     control: (base) => ({
//       ...base,
//       minHeight: 32,
//       fontSize: "0.8125rem",
//       borderColor: "#cbd5e1",
//       paddingLeft: 4,
//       paddingRight: 4,
//       borderRadius: "0.375rem",
//       boxShadow: "none",
//       "&:hover": {
//         borderColor: "#424687",
//       },
//     }),
//     placeholder: (base) => ({ ...base, fontSize: "0.8125rem" }),
//     singleValue: (base) => ({ ...base, fontSize: "0.8125rem" }),
//     input: (base) => ({ ...base, fontSize: "0.8125rem" }),
//     menu: (base) => ({ ...base, zIndex: 10002 }),
//     menuPortal: (base) => ({ ...base, zIndex: 10002 }),
//     menuList: (base) => ({ ...base, maxHeight: 280 }),
//   };

//   const selectPortalProps = {
//     menuPortalTarget:
//       typeof document !== "undefined" ? document.body : null,
//     menuPosition: "fixed",
//     menuPlacement: "auto",
//   };

//   return (
//     <div className="z-[99] min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/90 py-2 sm:py-3">
//       <div className="mx-auto flex w-full max-w-none flex-col gap-2">
//         {/* Entry form — compact */}
//         <div className="w-full rounded-xl border border-slate-200/90 bg-white/95 px-2.5 py-2 shadow-sm backdrop-blur-sm sm:px-4 sm:py-2.5">
//           <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
//             {/* Row 1 — party picks */}
//             <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-3">
//               <div className="min-w-0 w-full">
//                 <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
//                   Party Name
//                 </label>
//                 <Select
//                   options={partyOptions.filter((option) => option.value !== "")}
//                   value={
//                     partyOptions.find(
//                       (option) => option.value === formData.partyname,
//                     ) || null
//                   }
//                   onChange={handlePartyInputChange}
//                   placeholder="Select or search party…"
//                   className="w-full"
//                   classNamePrefix="select"
//                   isClearable
//                   isSearchable
//                   {...selectPortalProps}
//                   styles={portalSelectStyles}
//                 />
//               </div>
//               <div className="min-w-0 w-full">
//                 <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
//                   To Party
//                 </label>
//                 <Select
//                   options={partyOptions.filter(
//                     (option) =>
//                       option.value !== "" &&
//                       option.value !== formData.partyname,
//                   )}
//                   value={
//                     partyOptions.find(
//                       (option) => option.value === formData.toParty,
//                     ) || null
//                   }
//                   onChange={handleToPartyInputChange}
//                   placeholder="Transfer to party (optional)…"
//                   className="w-full"
//                   classNamePrefix="select"
//                   isClearable
//                   isSearchable
//                   {...selectPortalProps}
//                   styles={portalSelectStyles}
//                 />
//               </div>
//             </div>

//             {/* Row 2 — type, amount, date, remark (stack → 2 cols → 4 cols) */}
//             <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:grid-cols-4 lg:gap-3">
//               <div className="min-w-0 w-full">
//                 <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
//                   Transaction type*
//                 </label>
//                 {formData.toParty ? (
//                   <input
//                     type="text"
//                     value="Transfer"
//                     readOnly
//                     className="h-8 w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-100 px-2.5 text-xs text-slate-700 sm:text-sm"
//                   />
//                 ) : (
//                   <select
//                     name="transactionType"
//                     value={formData.transactionType}
//                     onChange={handleInputChange}
//                     className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-[#424687]/40 sm:text-sm"
//                   >
//                     <option value="credit">Deposit (Dena)</option>
//                     <option value="debit">Withdraw (Lena)</option>
//                   </select>
//                 )}
//               </div>
//               <div className="min-w-0 w-full">
//                 <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
//                   Amount*
//                 </label>
//                 <input
//                   type="text"
//                   name="amount"
//                   value={formData.amount}
//                   onChange={handleInputChange}
//                   placeholder="Enter amount"
//                   className="h-8 w-full rounded-md border border-slate-300 px-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-[#424687]/40 sm:text-sm"
//                   required
//                 />
//               </div>
//               <div className="min-w-0 w-full">
//                 <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
//                   Date
//                 </label>
//                 <input
//                   type="date"
//                   name="date"
//                   value={formData.date}
//                   onChange={handleInputChange}
//                   tabIndex={-1}
//                   className="h-8 w-full min-w-0 rounded-md border border-slate-300 px-2 text-xs transition focus:outline-none focus:ring-2 focus:ring-[#424687]/40 sm:text-sm"
//                   required
//                 />
//               </div>
//               <div className="min-w-0 w-full">
//                 <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
//                   Remark
//                 </label>
//                 <input
//                   type="text"
//                   name="remark"
//                   value={formData.remark}
//                   onChange={handleInputChange}
//                   placeholder="Remark (optional)"
//                   className="h-8 w-full rounded-md border border-slate-300 px-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-[#424687]/40 sm:text-sm"
//                 />
//               </div>
//             </div>

//             {/* Row 3 — actions */}
//             <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 sm:gap-2">
//               <button
//                 type="submit"
//                 className="inline-flex h-8 items-center gap-1 rounded-md bg-[#424687] px-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#353a6e] sm:px-3 sm:text-sm"
//                 title={editId ? "Update Account" : "Submit Account"}
//               >
//                 {editId ? "Update" : "Submit"}
//               </button>
//               <button
//                 type="button"
//                 onClick={handleDownload}
//                 className="inline-flex h-8 items-center justify-center rounded-md bg-emerald-600 px-2 text-white shadow-sm transition hover:bg-emerald-700"
//                 title="Download Statement"
//               >
//                 <FaFileDownload size={14} />
//               </button>
//               <button
//                 type="button"
//                 onClick={handleSendEmail}
//                 className="inline-flex h-8 items-center justify-center rounded-md bg-violet-600 px-2 text-white shadow-sm transition hover:bg-violet-700"
//                 title="Send JSON via Email"
//               >
//                 <FaEnvelope size={14} />
//               </button>
//               <label className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md bg-amber-600 px-2 text-white shadow-sm transition hover:bg-amber-700">
//                 <FaUpload size={14} />
//                 <input
//                   type="file"
//                   accept=".json"
//                   onChange={handleImport}
//                   className="hidden"
//                 />
//               </label>
//               <div className="ml-1 flex min-w-0 items-center gap-2 border-l border-slate-200 pl-2">
//                 <span className="whitespace-nowrap text-xs font-medium text-slate-600">
//                   Auto-Job
//                 </span>
//                 <label className="relative inline-flex cursor-pointer items-center">
//                   <input
//                     type="checkbox"
//                     checked={autoJobEnabled}
//                     onChange={handleToggleAutoJob}
//                     className="peer sr-only"
//                     aria-label="Toggle Auto-Job"
//                   />
//                   <div
//                     className="relative h-6 w-11 rounded-full bg-slate-300 transition-all after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-emerald-600 peer-checked:after:translate-x-[18px] peer-hover:bg-slate-400"
//                   ></div>
//                   <span
//                     className={`ml-1.5 text-xs font-semibold ${
//                       autoJobEnabled ? "text-emerald-600" : "text-slate-500"
//                     }`}
//                   >
//                     {autoJobEnabled ? "On" : "Off"}
//                   </span>
//                 </label>
//               </div>
//             </div>
//           </form>
//         </div>

//         {/* Main ledger card — table gets most vertical space */}
//         <div className="flex min-h-[min(78vh,calc(100vh-9rem))] flex-1 flex-col rounded-xl border border-slate-200/90 bg-white shadow-md lg:overflow-x-auto">
//           {loading && (
//             <p className="border-b border-slate-100 bg-slate-50 py-2 text-center text-sm text-[#424687]">
//               Loading…
//             </p>
//           )}
//           {error && (
//             <p className="border-b border-red-100 bg-red-50 py-2 text-center text-sm text-red-600">
//               {error}
//             </p>
//           )}
//           <div className="flex min-h-0 flex-1 flex-col">
//             {formData.partyname && groupedAccounts[formData.partyname] ? (
//               <>
//                 <div
//                   className={`flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/90 px-3 py-2.5 sm:px-4 ${
//                     balance > 0
//                       ? "bg-gradient-to-r from-red-50/80 to-white"
//                       : balance < 0
//                         ? "bg-gradient-to-r from-emerald-50/80 to-white"
//                         : ""
//                   }`}
//                 >
//                   <h2 className="text-sm font-semibold text-slate-800">
//                     {groupedAccounts[formData.partyname].partyname}
//                     <span className="ml-2 font-normal text-slate-500">
//                       · Ledger
//                     </span>
//                   </h2>
//                   <div
//                     className={`flex items-baseline gap-3 rounded-lg border px-3 py-1.5 shadow-sm ${
//                       balance > 0
//                         ? "border-red-200/80 bg-white/90"
//                         : balance < 0
//                           ? "border-emerald-200/80 bg-white/90"
//                           : "border-slate-200 bg-white/90"
//                     }`}
//                   >
//                     <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                       Closing
//                     </span>
//                     <span
//                       className={`text-base font-bold tabular-nums sm:text-lg ${balanceColor}`}
//                     >
//                       ₹ {balValue} {balSign}
//                     </span>
//                   </div>
//                 </div>

//                 {sortedAccounts.length === 0 ? (
//                   <p className="flex flex-1 items-center justify-center px-4 py-12 text-center text-sm text-slate-600">
//                     No accounts available for{" "}
//                     {groupedAccounts[formData.partyname].partyname}.
//                   </p>
//                 ) : (
//                   <div className="min-h-[min(68vh,calc(100vh-11rem))] flex-1 overflow-auto">
//                     <table className="w-full min-w-[640px] border-collapse text-sm">
//                       <thead className="sticky top-0 z-10 shadow-sm">
//                         <tr className="bg-[#424687] text-white">
//                           <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
//                             Date
//                           </th>
//                           <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
//                             Debit (-)
//                           </th>
//                           <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
//                             Credit (+)
//                           </th>
//                           <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
//                             Balance
//                           </th>
//                           <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
//                             Remark
//                           </th>
//                           <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
//                             Actions
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                       {currentAccounts.map((account, index) => {
//                         const currentBalance = sortedAccounts
//                           .slice(
//                             sortedAccounts.findIndex(
//                               (a) => a._id === account._id,
//                             ),
//                           )
//                           .reduce(
//                             (sum, acc) =>
//                               sum + (acc.debit || 0) - (acc.credit || 0),
//                             0,
//                           );
//                         const curBalSign =
//                           currentBalance > 0
//                             ? "D"
//                             : currentBalance < 0
//                               ? "C"
//                               : "";
//                         const curBalValue = formatNumber(
//                           Math.abs(currentBalance),
//                         );
//                         const currentBalanceColor =
//                           currentBalance > 0
//                             ? "text-red-600"
//                             : currentBalance < 0
//                               ? "text-green-600"
//                               : "text-gray-800";
//                         const displayRemark = getCleanRemark(account, parties);
//                         return (
//                           <tr
//                             key={account._id}
//                             className={`border-b border-slate-100/80 ${index % 2 === 0 ? "bg-slate-50/60" : "bg-white"} transition-colors hover:bg-indigo-50/40`}
//                           >
//                             <td className="whitespace-nowrap px-3 py-3 align-middle text-slate-800">
//                               {formatDate(account.date)}
//                             </td>
//                             <td className="whitespace-nowrap px-3 py-3 align-middle text-right font-medium tabular-nums text-red-600 sm:text-left">
//                               {account.debit > 0
//                                 ? formatNumber(account.debit)
//                                 : ""}
//                             </td>
//                             <td className="whitespace-nowrap px-3 py-3 align-middle text-right font-medium tabular-nums text-emerald-600 sm:text-left">
//                               {account.credit > 0
//                                 ? formatNumber(account.credit)
//                                 : ""}
//                             </td>
//                             <td
//                               className={`whitespace-nowrap px-3 py-3 align-middle font-semibold tabular-nums ${currentBalanceColor}`}
//                             >
//                               ₹ {curBalValue} {curBalSign}
//                             </td>
//                             <td className="max-w-[14rem] px-3 py-3 align-middle text-slate-700 sm:max-w-md">
//                               {displayRemark}
//                             </td>
//                             <td className="whitespace-nowrap px-3 py-3 align-middle">
//                               <div className="flex flex-wrap items-center gap-2">
//                                 <button
//                                   onClick={() => handleEdit(account)}
//                                   className="rounded-md p-1 text-[#424687] transition hover:bg-[#424687]/10 hover:text-[#353a6e]"
//                                   title="Edit Account"
//                                 >
//                                   <FaEdit size={17} />
//                                 </button>

//                                 {!account.verified && (
//                                   <>
//                                     <button
//                                       onClick={() =>
//                                         handleDelete(account._id)
//                                       }
//                                       className="rounded-md p-1 text-red-600 transition hover:bg-red-50 hover:text-red-800"
//                                       title="Delete Account"
//                                     >
//                                       <FaTrash size={17} />
//                                     </button>
//                                     <button
//                                       onClick={() =>
//                                         handleVerify(account._id)
//                                       }
//                                       className="rounded-md p-1 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-800"
//                                       title="Verify Account"
//                                     >
//                                       <FaCheck size={17} />
//                                     </button>
//                                   </>
//                                 )}

//                                 {account.verified && (
//                                   <span className="text-xs font-semibold text-emerald-600">
//                                     Verified
//                                   </span>
//                                 )}
//                               </div>
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                   </div>
//                 )}
//               </>
//             ) : (
//               <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
//                 <p className="text-sm text-slate-500">
//                   Please select a party to view accounts.
//                 </p>
//               </div>
//             )}
//           </div>
//           <div className="flex flex-shrink-0 flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
//             <div className="text-xs text-slate-600 sm:text-sm">
//               Showing {indexOfFirst + 1} to{" "}
//               {Math.min(indexOfLast, sortedAccounts.length)} of{" "}
//               {sortedAccounts.length} entries
//             </div>

//             <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 lg:w-auto">
//               <div className="flex items-center gap-2">
//               <label className="whitespace-nowrap text-xs text-slate-600">
//                 Show
//               </label>

//               <Select
//                 options={entriesPerPageOptions}
//                 value={entriesPerPageOptions.find(
//                   (option) => option.value === entriesPerPage,
//                 )}
//                 onChange={handleEntriesPerPageChange}
//                 className="w-28 min-w-[7rem]"
//                 classNamePrefix="select"
//                 {...selectPortalProps}
//                 styles={portalSelectStyles}
//               />

//               <label className="whitespace-nowrap text-xs text-slate-600">
//                 entries
//               </label>
//             </div>

//             <div className="flex items-center gap-2">
//               <input
//                 type="number"
//                 value={pageInput}
//                 onChange={handlePageInputChange}
//                 placeholder="Page"
//                 className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
//               />

//               <button
//                 onClick={handleGoToPage}
//                 className="rounded-md bg-[#424687] px-2.5 py-1.5 text-white shadow-sm transition hover:bg-[#353a6e]"
//                 title="Go to Page"
//               >
//                 <FaArrowRight size={16} />
//               </button>
//             </div>

//             <div className="flex flex-wrap items-center gap-2 sm:gap-3">
//               <button
//                 onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//                 disabled={currentPage === 1}
//                 className="rounded-md bg-[#424687] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#353a6e] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
//               >
//                 Previous
//               </button>

//               <span className="whitespace-nowrap text-xs text-slate-700 sm:text-sm">
//                 Page {currentPage} of {totalPages || 1}
//               </span>

//               <button
//                 onClick={() =>
//                   setCurrentPage((prev) => Math.min(prev + 1, totalPages))
//                 }
//                 disabled={currentPage === totalPages || totalPages === 0}
//                 className="rounded-md bg-[#424687] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#353a6e] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
//               >
//                 Next
//               </button>
//             </div>
//             </div>
//           </div>
//         </div>
//       </div>
//       {showPdfPreview && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
//           <div className="bg-white w-full max-w-5xl h-[100vh] rounded-xl overflow-hidden shadow-2xl flex flex-col">
//             {/* Header */}
//             <div className="flex justify-between items-center p-4 border-b">
//               <h2 className="text-xl font-bold text-gray-800">PDF Preview</h2>

//               <button
//                 onClick={() => {
//                   setShowPdfPreview(false);
//                   URL.revokeObjectURL(pdfPreviewUrl);
//                 }}
//                 className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//               >
//                 Cancel
//               </button>
//             </div>

//             {/* PDF Preview */}
//             <div className="flex-1 bg-gray-200">
//               <iframe
//                 src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
//                 title="PDF Preview"
//                 className="w-full h-full border-0"
//               />
//             </div>

//             {/* Footer */}
//             <div className="p-4 border-t flex justify-end">
//               <button
//                 onClick={handleFinalDownload}
//                 className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
//               >
//                 Download PDF
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Account;



import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  createAccount,
  updateAccount,
  deleteAccount,
  verifyAccount,
  sendStatementEmail,
  importAccounts,
  toggleAutoJob,
} from "../redux/accountSlice";
import {
  fetchAccountsPage,
  createLoadPartyOptions,
  fetchPartyOptionById,
} from "../api/paginatedApi";
import { jsPDF } from "jspdf";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaFileDownload,
  FaArrowRight,
  FaEnvelope,
  FaUpload,
} from "react-icons/fa";

// Utility function to format numbers with commas
const formatNumber = (number) => {
  if (number === undefined || number === null || isNaN(number)) return "0";
  return Number(number).toLocaleString("en-IN");
};

// Utility function to remove commas for raw number
const parseNumber = (value) => {
  return value.replace(/,/g, "");
};

// Utility function to format dates
const formatDate = (date) => {
  if (!date || isNaN(new Date(date))) return "N/A";
  const options = { day: "numeric", month: "short", year: "numeric" };
  return new Date(date).toLocaleDateString("en-GB", options);
};

// Utility function to get clean remark
const getCleanRemark = (account) => {
  let r = account.remark || "";
  if (r) {
    const match = r.match(/^(.*)\s*\(Transfer (to|from) [^)]+\)$/);
    if (match) {
      r = match[1].trim();
    }
    return r;
  }
  return "";
};

const Account = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, autoJobEnabled } = useSelector(
    (state) => state.account,
  );
  const [formData, setFormData] = useState({
    partyname: "",
    amount: "",
    transactionType: "debit",
    remark: "",
    date: new Date().toISOString().split("T")[0],
    toParty: "",
  });
  const [editId, setEditId] = useState(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [selectedPartyAccounts, setSelectedPartyAccounts] = useState([]);
  const [partyAccountsLoading, setPartyAccountsLoading] = useState(false);
  const [accountsPagination, setAccountsPagination] = useState(null);
  const [partySummary, setPartySummary] = useState(null);
  const [selectedPartyOption, setSelectedPartyOption] = useState(null);
  const [toPartyOption, setToPartyOption] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL;

  const entriesPerPageOptions = [
    { value: 10, label: "10" },
    { value: 20, label: "20" },
    { value: 30, label: "30" },
    { value: 50, label: "50" },
    { value: 100, label: "100" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        dispatch({
          type: "account/toggleAutoJob/fulfilled",
          payload: { autoJobEnabled: decoded.autoJobEnabled || false },
        });
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }
  }, [dispatch]);

  useEffect(() => {
    if (formData.partyname) {
      fetchPartyOptionById(formData.partyname).then(setSelectedPartyOption);
    } else {
      setSelectedPartyOption(null);
    }
  }, [formData.partyname]);

  useEffect(() => {
    if (formData.toParty) {
      fetchPartyOptionById(formData.toParty).then(setToPartyOption);
    } else {
      setToPartyOption(null);
    }
  }, [formData.toParty]);

  const loadSelectedPartyAccounts = async (
    partyId,
    page = currentPage,
    limit = entriesPerPage,
  ) => {
    if (!partyId) {
      setSelectedPartyAccounts([]);
      setAccountsPagination(null);
      setPartySummary(null);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      setPartyAccountsLoading(true);
      const data = await fetchAccountsPage({
        party: partyId,
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setSelectedPartyAccounts(data.accounts || []);
      setAccountsPagination(data.pagination || null);
      setPartySummary(data.partySummary || null);
    } catch (err) {
      console.error("Error loading selected party accounts:", err);
      setSelectedPartyAccounts([]);
      setAccountsPagination(null);
      setPartySummary(null);
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        navigate("/");
        return;
      }
      alert(
        `Error loading party accounts: ${err.response?.data?.message || err.message}`,
      );
    } finally {
      setPartyAccountsLoading(false);
    }
  };

  useEffect(() => {
    loadSelectedPartyAccounts(formData.partyname, currentPage, entriesPerPage);
  }, [formData.partyname, currentPage, entriesPerPage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount") {
      // Remove non-numeric characters except for decimal point
      const numericValue = value.replace(/[^0-9.]/g, "");
      // Ensure only one decimal point
      const parts = numericValue.split(".");
      const num = parts[0];
      const integerPart = num === "" ? "" : Number(num).toLocaleString("en-IN");
      let formattedValue = integerPart;
      if (parts.length > 1) {
        formattedValue += "." + parts[1].slice(0, 2); // Limit to 2 decimal places
      }
      setFormData({ ...formData, [name]: formattedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePartyInputChange = (selectedOption) => {
    const partyname = selectedOption ? selectedOption.value : "";
    const transactionType = formData.toParty ? "transfer" : "credit";
    setSelectedPartyOption(selectedOption);
    setSelectedPartyAccounts([]);
    setFormData({ ...formData, partyname, transactionType });
    setCurrentPage(1);
  };

  const handleToPartyInputChange = (selectedOption) => {
    const toParty = selectedOption ? selectedOption.value : "";
    setToPartyOption(selectedOption);
    setFormData((prev) => ({
      ...prev,
      toParty,
      transactionType: toParty ? "transfer" : "credit",
    }));
  };

  const handleEntriesPerPageChange = (selectedOption) => {
    setEntriesPerPage(selectedOption.value);
    setCurrentPage(1);
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handleGoToPage = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages && !isNaN(pageNumber)) {
      setCurrentPage(pageNumber);
      setPageInput("");
    } else {
      alert("Please enter a valid page number");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partyname || !formData.amount || !formData.date) {
      alert("Party name, amount, and date are required");
      return;
    }
    const accountData = {
      partyname: formData.partyname,
      credit:
        formData.transactionType === "credit"
          ? parseFloat(parseNumber(formData.amount))
          : formData.transactionType === "transfer"
            ? 0
            : 0,
      debit:
        formData.transactionType === "debit"
          ? parseFloat(parseNumber(formData.amount))
          : formData.transactionType === "transfer"
            ? parseFloat(parseNumber(formData.amount))
            : 0,
      remark: formData.remark,
      date: formData.date,
      to: formData.toParty || undefined,
    };
    try {
      if (editId) {
        await dispatch(updateAccount({ id: editId, ...accountData })).unwrap();
        showMessages(accountData.credit, accountData.debit, formData.partyname);
        await loadSelectedPartyAccounts(formData.partyname, 1, entriesPerPage);
        setFormData({
          partyname: formData.partyname,
          amount: "",
          transactionType: formData.toParty ? "transfer" : "credit",
          remark: "",
          date: formData.date,
          toParty: formData.toParty,
        });
        setEditId(null);
      } else {
        const result = await dispatch(createAccount(accountData)).unwrap();
        showMessages(accountData.credit, accountData.debit, formData.partyname);
        await loadSelectedPartyAccounts(formData.partyname, 1, entriesPerPage);
      }
    } catch (err) {
      if (err === "No token available" || err.includes("Invalid token")) {
        navigate("/");
      } else {
        alert("Error creating/updating account: " + err);
      }
    }
  };

  const showMessages = (credit, debit, partyId) => {
    const partyName = selectedPartyOption?.label || "this party";
  };

  const handleEdit = (account) => {
    // Verified account ko bhi edit/update allow kiya hai.
    // Delete verified account abhi bhi blocked rahega.
    const transactionType =
      account.credit > 0
        ? "credit"
        : account.debit > 0 && account.to
          ? "transfer"
          : "debit";
    setFormData({
      partyname: account.partyname._id,
      amount: formatNumber(account.credit > 0 ? account.credit : account.debit),
      transactionType,
      remark: account.remark || "",
      date: new Date(account.date).toISOString().split("T")[0],
      toParty: account.to || "",
    });
    setEditId(account._id);
  };

  const handleDelete = (id) => {
    const account = selectedPartyAccounts.find((acc) => acc._id === id);
    if (account.verified) {
      alert("This account is verified and cannot be deleted.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this account?")) {
      return;
    }
    dispatch(deleteAccount(id))
      .unwrap()
      .then(() => {
        loadSelectedPartyAccounts(formData.partyname, currentPage, entriesPerPage);
      })
      .catch((err) => {
        if (err === "No token available" || err.includes("Invalid token")) {
          navigate("/");
        }
      });
  };

  const handleVerify = (id) => {
    dispatch(verifyAccount(id))
      .unwrap()
      .then(() => {
        loadSelectedPartyAccounts(formData.partyname, currentPage, entriesPerPage);
      })
      .catch((err) => {
        if (err === "No token available" || err.includes("Invalid token")) {
          navigate("/");
        }
      });
  };

  const handleDownload = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    if (!formData.partyname) {
      alert("Please select a party to download the statement.");
      return;
    }
    let url = `${API_URL}/accounts/statement/download`;
    if (formData.partyname) {
      url += `?party=${formData.partyname}`;
    }
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Invalid response: Expected JSON data, but received binary (e.g., PDF). Check backend.",
        );
      }
      const grouped = await response.json();
      if (
        !grouped ||
        typeof grouped !== "object" ||
        Object.keys(grouped).length === 0
      ) {
        throw new Error("Invalid or empty data received from server");
      }
      Object.keys(grouped).forEach((pId) => {
        const doc = new jsPDF();
        let y = 20;
        let page = 1;
        const group = grouped[pId];
        if (!group || !group.accounts || group.accounts.length === 0) {
          return;
        }
        const partyName = group.partyname || group.name || selectedPartyName;
        if (!partyName) {
          return;
        }
        // Header
        doc.setFillColor(0, 51, 102);
        doc.rect(0, 0, 210, 15, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("times", "bold");
        doc.text(`${partyName} Statement`, 10, 10);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont("times", "normal");
        y += 10;

        // Calculate balance
        const balance = (group.totalDebit || 0) - (group.totalCredit || 0);
        const balSign = balance > 0 ? "Dr" : balance < 0 ? "Cr" : "";
        const balValue = formatNumber(Math.abs(balance));
        const balanceTextColor = balSign === "Cr" ? [0, 128, 0] : [255, 0, 0]; // Green for Cr, Red for Dr

        // Closing Balance Box (Right Side, Above Table)
        const boxX = 130;
        const boxWidth = 70;
        const boxHeight = 20;
        const bgColor =
          balance > 0
            ? [255, 200, 200]
            : balance < 0
              ? [200, 255, 200]
              : [240, 240, 240];
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(boxX, y, boxWidth, boxHeight, "F");
        doc.setDrawColor(150, 150, 150);
        doc.rect(boxX, y, boxWidth, boxHeight);
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.setTextColor(
          balanceTextColor[0],
          balanceTextColor[1],
          balanceTextColor[2],
        );
        doc.text("Closing Balance", boxX + 5, y + 8);
        doc.setFont("times", "normal");
        doc.setTextColor(
          balanceTextColor[0],
          balanceTextColor[1],
          balanceTextColor[2],
        );
        doc.text(`Rs. ${balValue} ${balSign}`, boxX + 5, y + 16);
        y += 25;

        // Table setup
        const tableX = 10;
        const tableWidth = 190;
        const colWidths = [35, 35, 35, 35, 50]; // Adjusted widths: reduced Date, Debit, Credit, Balance; increased Remark
        const baseRowHeight = 8;
        const tableStartY = y;

        // Table header
        doc.setFillColor(0, 51, 102);
        doc.rect(tableX, y, tableWidth, baseRowHeight, "F");
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.setFont("times", "bold");
        doc.text("Date", tableX + 2, y + 6);
        doc.text("Debit (-)", tableX + 37, y + 6);
        doc.text("Credit (+)", tableX + 72, y + 6);
        doc.text("Balance", tableX + 107, y + 6);
        doc.text("Remark", tableX + 142, y + 6);
        y += baseRowHeight;
        doc.setFont("times", "normal");
        doc.setTextColor(0, 0, 0);

        // Filter and sort accounts for PDF
        const validAccounts = group.accounts
          .filter((acc) => acc && acc.date && !isNaN(new Date(acc.date)))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (validAccounts.length === 0) {
          doc.setFontSize(10);
          doc.setTextColor(255, 0, 0);
          doc.text(
            "No valid accounts available for this party.",
            tableX,
            y + 10,
          );
          const pdfBlob = doc.output("blob");
          const pdfUrl = URL.createObjectURL(pdfBlob);

          setPdfPreviewUrl(pdfUrl);
          setPdfFileName(`${partyName}_account_statement.pdf`);
          setShowPdfPreview(true);
          return;
        }

        // Create reverse sorted accounts for balance calculation
        const reverseSortedAccounts = [...validAccounts].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );

        validAccounts.forEach((acc, rowIndex) => {
          // Reverse balance calculation
          const reverseIndex = validAccounts.length - rowIndex - 1;
          let currentBalance = 0;
          const accountsUpToReverseIndex = reverseSortedAccounts.slice(
            0,
            reverseIndex + 1,
          );
          accountsUpToReverseIndex.forEach((acc) => {
            currentBalance += (acc.debit || 0) - (acc.credit || 0);
          });
          const curBalSign =
            currentBalance > 0 ? "Dr" : currentBalance < 0 ? "Cr" : "";
          const curBalValue = formatNumber(Math.abs(currentBalance));
          const currentBalanceTextColor =
            curBalSign === "Cr" ? [0, 128, 0] : [255, 0, 0];

          // Handle remark and calculate dynamic row height
          const remarkText = getCleanRemark(acc);
          const maxWidth = colWidths[4] - 4; // Adjust for padding
          const splitText = doc.splitTextToSize(remarkText, maxWidth);
          const textHeight = splitText.length * 5; // Approximate height per line (5 units per line)
          const rowHeight = Math.max(baseRowHeight, textHeight);

          // Draw row background if even
          if (rowIndex % 2 === 0) {
            doc.setFillColor(240, 240, 240);
            doc.rect(tableX, y, tableWidth, rowHeight, "F");
          }

          // Draw single row border for the entire table row
          doc.setDrawColor(150, 150, 150);
          doc.rect(tableX, y, tableWidth, rowHeight);

          let x = tableX;
          let lineY = y + 6; // Starting y-position for text
          colWidths.forEach((width, i) => {
            if (i === 0) doc.text(formatDate(acc.date), x + 2, lineY);
            if (i === 1 && (acc.debit || 0) > 0) {
              doc.setTextColor(255, 0, 0);
              doc.text(formatNumber(acc.debit || 0), x + 2, lineY);
              doc.setTextColor(0, 0, 0);
            }
            if (i === 2 && (acc.credit || 0) > 0) {
              doc.setTextColor(0, 128, 0);
              doc.text(formatNumber(acc.credit || 0), x + 2, lineY);
              doc.setTextColor(0, 0, 0);
            }
            if (i === 3) {
              doc.setTextColor(
                currentBalanceTextColor[0],
                currentBalanceTextColor[1],
                currentBalanceTextColor[2],
              );
              doc.text(`${curBalValue} ${curBalSign}`, x + 2, lineY); // Removed "Rs."
              doc.setTextColor(0, 0, 0);
            }
            if (i === 4) {
              // Adjust y-position for multi-line text
              let textY = y + 4; // Start slightly above to center vertically
              splitText.forEach((line, index) => {
                doc.text(line, x + 2, textY + index * 5);
              });
            }
            x += width;
          });

          y += rowHeight;

          // Check if we need a new page
          if (y > 260 && rowIndex < validAccounts.length - 1) {
            doc.addPage();
            y = 20;
            page++;
            doc.setFillColor(0, 51, 102);
            doc.rect(0, 0, 210, 15, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont("times", "bold");
            doc.text(`${partyName} Statement`, 10, 10);
            y += 15;

            // Closing Balance Box (Right Side, Above Table) - NEW PAGE
            doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
            doc.rect(boxX, y, boxWidth, boxHeight, "F");
            doc.setDrawColor(150, 150, 150);
            doc.rect(boxX, y, boxWidth, boxHeight);
            doc.setFontSize(12);
            doc.setFont("times", "bold");
            doc.setTextColor(
              balanceTextColor[0],
              balanceTextColor[1],
              balanceTextColor[2],
            );
            doc.text("Closing Balance", boxX + 5, y + 8);
            doc.setFont("times", "normal");
            doc.setTextColor(
              balanceTextColor[0],
              balanceTextColor[1],
              balanceTextColor[2],
            );
            doc.text(`Rs. ${balValue} ${balSign}`, boxX + 5, y + 16);
            y += 25;

            doc.setFillColor(0, 51, 102);
            doc.rect(tableX, y, tableWidth, baseRowHeight, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont("times", "bold");
            doc.text("Date", tableX + 2, y + 6);
            doc.text("Debit (-)", tableX + 37, y + 6);
            doc.text("Credit (+)", tableX + 72, y + 6);
            doc.text("Balance", tableX + 107, y + 6);
            doc.text("Remark", tableX + 142, y + 6);
            y += baseRowHeight;
            doc.setFont("times", "normal");
            doc.setTextColor(0, 0, 0);
          }
        });

        // Add report generation timestamp
        y += 15;
        const now = new Date();
        const hours = now.getHours() % 12 || 12;
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const ampm = now.getHours() >= 12 ? "PM" : "AM";
        const genDate = formatDate(now).replace(
          /\d{4}$/,
          `'${now.getFullYear().toString().slice(2)}`,
        );
        const genTime = `${hours}:${minutes} ${ampm} | ${genDate}`;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Report Generated: ${genTime}`, tableX, y);

        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);

        setPdfPreviewUrl(pdfUrl);
        setPdfFileName(`${partyName}_account_statement.pdf`);
        setShowPdfPreview(true);
      });
    } catch (error) {
      alert("Error generating statement: " + error.message);
    }
  };

  const handleFinalDownload = () => {
    const link = document.createElement("a");
    link.href = pdfPreviewUrl;
    link.download = pdfFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowPdfPreview(false);
  };

  const handleSendEmail = async () => {
    try {
      await dispatch(sendStatementEmail()).unwrap();
      alert("JSON file sent via email successfully");
    } catch (err) {
      // Display the exact error message from the backend
      const errorMessage = err || "An unknown error occurred";
      alert(`Error sending email: ${errorMessage}`);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await dispatch(importAccounts(file)).unwrap();
      await loadSelectedPartyAccounts(formData.partyname, currentPage, entriesPerPage);
      alert("Data imported successfully");
    } catch (err) {
      alert("Error importing data: " + err);
    }
  };

  const handleToggleAutoJob = async () => {
    try {
      const result = await dispatch(toggleAutoJob()).unwrap();
      localStorage.setItem("token", result.token); // Update token with new autoJobEnabled state
      alert(
        `Daily email job ${result.autoJobEnabled ? "enabled" : "disabled"} successfully`,
      );
    } catch (err) {
      alert("Error toggling auto-job: " + err);
    }
  };

  const selectedPartyName =
    selectedPartyOption?.label ||
    partySummary?.partyName ||
    selectedPartyAccounts[0]?.partyname?.partyname ||
    "";

  const groupedAccounts =
    formData.partyname && selectedPartyName
      ? {
          [formData.partyname]: {
            partyname: selectedPartyName,
            accounts: selectedPartyAccounts,
          },
        }
      : {};

  const currentAccounts = (selectedPartyAccounts || []).filter(
    (acc) => acc && acc._id && acc.date && !isNaN(new Date(acc.date)),
  );
  const totalPages = accountsPagination?.totalPages || 1;
  const totalDebit = partySummary?.totalDebit ?? 0;
  const totalCredit = partySummary?.totalCredit ?? 0;
  const balance = partySummary?.closingBalance ?? totalDebit - totalCredit;
  const balSign = balance > 0 ? "D" : balance < 0 ? "C" : "";
  const balValue = formatNumber(Math.abs(balance));
  const balanceColor =
    balance > 0
      ? "text-red-600"
      : balance < 0
        ? "text-green-600"
        : "text-gray-800";

  const portalSelectStyles = {
    control: (base) => ({
      ...base,
      minHeight: 32,
      fontSize: "0.8125rem",
      borderColor: "#cbd5e1",
      paddingLeft: 4,
      paddingRight: 4,
      borderRadius: "0.375rem",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#424687",
      },
    }),
    placeholder: (base) => ({ ...base, fontSize: "0.8125rem" }),
    singleValue: (base) => ({ ...base, fontSize: "0.8125rem" }),
    input: (base) => ({ ...base, fontSize: "0.8125rem" }),
    menu: (base) => ({ ...base, zIndex: 10002 }),
    menuPortal: (base) => ({ ...base, zIndex: 10002 }),
    menuList: (base) => ({ ...base, maxHeight: 280 }),
  };

  const selectPortalProps = {
    menuPortalTarget:
      typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed",
    menuPlacement: "auto",
  };

  return (
    <div className="z-[99] min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/90 py-2 sm:py-3">
      <div className="mx-auto flex w-full max-w-none flex-col gap-2">
        {/* Entry form — compact */}
        <div className="w-full rounded-xl border border-slate-200/90 bg-white/95 px-2.5 py-2 shadow-sm backdrop-blur-sm sm:px-4 sm:py-2.5">
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
            {/* Row 1 — party picks */}
            <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-3">
              <div className="min-w-0 w-full">
                <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
                  Party Name
                </label>
                <AsyncSelect
                  cacheOptions
                  defaultOptions
                  loadOptions={createLoadPartyOptions()}
                  value={selectedPartyOption}
                  onChange={handlePartyInputChange}
                  placeholder="Select or search party…"
                  className="w-full"
                  classNamePrefix="select"
                  isClearable
                  {...selectPortalProps}
                  styles={portalSelectStyles}
                />
              </div>
              <div className="min-w-0 w-full">
                <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
                  To Party
                </label>
                <AsyncSelect
                  cacheOptions
                  defaultOptions
                  loadOptions={createLoadPartyOptions(formData.partyname)}
                  value={toPartyOption}
                  onChange={handleToPartyInputChange}
                  placeholder="Transfer to party (optional)…"
                  className="w-full"
                  classNamePrefix="select"
                  isClearable
                  {...selectPortalProps}
                  styles={portalSelectStyles}
                />
              </div>
            </div>

            {/* Row 2 — type, amount, date, remark (stack → 2 cols → 4 cols) */}
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:grid-cols-4 lg:gap-3">
              <div className="min-w-0 w-full">
                <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
                  Transaction type*
                </label>
                {formData.toParty ? (
                  <input
                    type="text"
                    value="Transfer"
                    readOnly
                    className="h-8 w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-100 px-2.5 text-xs text-slate-700 sm:text-sm"
                  />
                ) : (
                  <select
                    name="transactionType"
                    value={formData.transactionType}
                    onChange={handleInputChange}
                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-[#424687]/40 sm:text-sm"
                  >
                    <option value="credit">Deposit (Dena)</option>
                    <option value="debit">Withdraw (Lena)</option>
                  </select>
                )}
              </div>
              <div className="min-w-0 w-full">
                <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
                  Amount*
                </label>
                <input
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className="h-8 w-full rounded-md border border-slate-300 px-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-[#424687]/40 sm:text-sm"
                  required
                />
              </div>
              <div className="min-w-0 w-full">
                <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  tabIndex={-1}
                  className="h-8 w-full min-w-0 rounded-md border border-slate-300 px-2 text-xs transition focus:outline-none focus:ring-2 focus:ring-[#424687]/40 sm:text-sm"
                  required
                />
              </div>
              <div className="min-w-0 w-full">
                <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
                  Remark
                </label>
                <input
                  type="text"
                  name="remark"
                  value={formData.remark}
                  onChange={handleInputChange}
                  placeholder="Remark (optional)"
                  className="h-8 w-full rounded-md border border-slate-300 px-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-[#424687]/40 sm:text-sm"
                />
              </div>
            </div>

            {/* Row 3 — actions */}
            <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 sm:gap-2">
              <button
                type="submit"
                className="inline-flex h-8 items-center gap-1 rounded-md bg-[#424687] px-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#353a6e] sm:px-3 sm:text-sm"
                title={editId ? "Update Account" : "Submit Account"}
              >
                {editId ? "Update" : "Submit"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex h-8 items-center justify-center rounded-md bg-emerald-600 px-2 text-white shadow-sm transition hover:bg-emerald-700"
                title="Download Statement"
              >
                <FaFileDownload size={14} />
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                className="inline-flex h-8 items-center justify-center rounded-md bg-violet-600 px-2 text-white shadow-sm transition hover:bg-violet-700"
                title="Send JSON via Email"
              >
                <FaEnvelope size={14} />
              </button>
              <label className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md bg-amber-600 px-2 text-white shadow-sm transition hover:bg-amber-700">
                <FaUpload size={14} />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <div className="ml-1 flex min-w-0 items-center gap-2 border-l border-slate-200 pl-2">
                <span className="whitespace-nowrap text-xs font-medium text-slate-600">
                  Auto-Job
                </span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={autoJobEnabled}
                    onChange={handleToggleAutoJob}
                    className="peer sr-only"
                    aria-label="Toggle Auto-Job"
                  />
                  <div
                    className="relative h-6 w-11 rounded-full bg-slate-300 transition-all after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-emerald-600 peer-checked:after:translate-x-[18px] peer-hover:bg-slate-400"
                  ></div>
                  <span
                    className={`ml-1.5 text-xs font-semibold ${
                      autoJobEnabled ? "text-emerald-600" : "text-slate-500"
                    }`}
                  >
                    {autoJobEnabled ? "On" : "Off"}
                  </span>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Main ledger card — table gets most vertical space */}
        <div className="flex min-h-[min(78vh,calc(100vh-9rem))] flex-1 flex-col rounded-xl border border-slate-200/90 bg-white shadow-md lg:overflow-x-auto">
          {(loading || partyAccountsLoading) && (
            <p className="border-b border-slate-100 bg-slate-50 py-2 text-center text-sm text-[#424687]">
              Loading…
            </p>
          )}
          {error && (
            <p className="border-b border-red-100 bg-red-50 py-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex min-h-0 flex-1 flex-col">
            {formData.partyname && groupedAccounts[formData.partyname] ? (
              <>
                <div
                  className={`flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/90 px-3 py-2.5 sm:px-4 ${
                    balance > 0
                      ? "bg-gradient-to-r from-red-50/80 to-white"
                      : balance < 0
                        ? "bg-gradient-to-r from-emerald-50/80 to-white"
                        : ""
                  }`}
                >
                  <h2 className="text-sm font-semibold text-slate-800">
                    {groupedAccounts[formData.partyname].partyname}
                    <span className="ml-2 font-normal text-slate-500">
                      · Ledger
                    </span>
                  </h2>
                  <div
                    className={`flex items-baseline gap-3 rounded-lg border px-3 py-1.5 shadow-sm ${
                      balance > 0
                        ? "border-red-200/80 bg-white/90"
                        : balance < 0
                          ? "border-emerald-200/80 bg-white/90"
                          : "border-slate-200 bg-white/90"
                    }`}
                  >
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Closing
                    </span>
                    <span
                      className={`text-base font-bold tabular-nums sm:text-lg ${balanceColor}`}
                    >
                      ₹ {balValue} {balSign}
                    </span>
                  </div>
                </div>

                {currentAccounts.length === 0 && !partyAccountsLoading ? (
                  <p className="flex flex-1 items-center justify-center px-4 py-12 text-center text-sm text-slate-600">
                    No accounts available for{" "}
                    {groupedAccounts[formData.partyname].partyname}.
                  </p>
                ) : (
                  <div className="min-h-[min(68vh,calc(100vh-11rem))] flex-1 overflow-auto">
                    <table className="w-full min-w-[640px] border-collapse text-sm">
                      <thead className="sticky top-0 z-10 shadow-sm">
                        <tr className="bg-[#424687] text-white">
                          <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                            Date
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                            Debit (-)
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                            Credit (+)
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                            Balance
                          </th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                            Remark
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                      {currentAccounts.map((account, index) => {
                        const currentBalance =
                          account.runningBalance ??
                          (account.debit || 0) - (account.credit || 0);
                        const curBalSign =
                          currentBalance > 0
                            ? "D"
                            : currentBalance < 0
                              ? "C"
                              : "";
                        const curBalValue = formatNumber(
                          Math.abs(currentBalance),
                        );
                        const currentBalanceColor =
                          currentBalance > 0
                            ? "text-red-600"
                            : currentBalance < 0
                              ? "text-green-600"
                              : "text-gray-800";
                        const displayRemark = getCleanRemark(account);
                        return (
                          <tr
                            key={account._id}
                            className={`border-b border-slate-100/80 ${index % 2 === 0 ? "bg-slate-50/60" : "bg-white"} transition-colors hover:bg-indigo-50/40`}
                          >
                            <td className="whitespace-nowrap px-3 py-3 align-middle text-slate-800">
                              {formatDate(account.date)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 align-middle text-right font-medium tabular-nums text-red-600 sm:text-left">
                              {account.debit > 0
                                ? formatNumber(account.debit)
                                : ""}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 align-middle text-right font-medium tabular-nums text-emerald-600 sm:text-left">
                              {account.credit > 0
                                ? formatNumber(account.credit)
                                : ""}
                            </td>
                            <td
                              className={`whitespace-nowrap px-3 py-3 align-middle font-semibold tabular-nums ${currentBalanceColor}`}
                            >
                              ₹ {curBalValue} {curBalSign}
                            </td>
                            <td className="max-w-[14rem] px-3 py-3 align-middle text-slate-700 sm:max-w-md">
                              {displayRemark}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 align-middle">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => handleEdit(account)}
                                  className="rounded-md p-1 text-[#424687] transition hover:bg-[#424687]/10 hover:text-[#353a6e]"
                                  title="Edit Account"
                                >
                                  <FaEdit size={17} />
                                </button>

                                {!account.verified && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleDelete(account._id)
                                      }
                                      className="rounded-md p-1 text-red-600 transition hover:bg-red-50 hover:text-red-800"
                                      title="Delete Account"
                                    >
                                      <FaTrash size={17} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleVerify(account._id)
                                      }
                                      className="rounded-md p-1 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-800"
                                      title="Verify Account"
                                    >
                                      <FaCheck size={17} />
                                    </button>
                                  </>
                                )}

                                {account.verified && (
                                  <span className="text-xs font-semibold text-emerald-600">
                                    Verified
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
                <p className="text-sm text-slate-500">
                  Please select a party to view accounts.
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-shrink-0 flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-xs text-slate-600 sm:text-sm">
              Showing{" "}
              {accountsPagination?.totalRecords
                ? (currentPage - 1) * entriesPerPage + 1
                : 0}{" "}
              to{" "}
              {(accountsPagination?.totalRecords ?? 0) > 0
                ? `${Math.min(currentPage * entriesPerPage, accountsPagination.totalRecords)} of ${accountsPagination.totalRecords} entries`
                : "0 entries"}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 lg:w-auto">
              <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-xs text-slate-600">
                Show
              </label>

              <Select
                options={entriesPerPageOptions}
                value={entriesPerPageOptions.find(
                  (option) => option.value === entriesPerPage,
                )}
                onChange={handleEntriesPerPageChange}
                className="w-28 min-w-[7rem]"
                classNamePrefix="select"
                {...selectPortalProps}
                styles={portalSelectStyles}
              />

              <label className="whitespace-nowrap text-xs text-slate-600">
                entries
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={pageInput}
                onChange={handlePageInputChange}
                placeholder="Page"
                className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
              />

              <button
                onClick={handleGoToPage}
                className="rounded-md bg-[#424687] px-2.5 py-1.5 text-white shadow-sm transition hover:bg-[#353a6e]"
                title="Go to Page"
              >
                <FaArrowRight size={16} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-md bg-[#424687] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#353a6e] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                Previous
              </button>

              <span className="whitespace-nowrap text-xs text-slate-700 sm:text-sm">
                Page {currentPage} of {totalPages || 1}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="rounded-md bg-[#424687] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#353a6e] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                Next
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
      {showPdfPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white w-full max-w-5xl h-[100vh] rounded-xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">PDF Preview</h2>

              <button
                onClick={() => {
                  setShowPdfPreview(false);
                  URL.revokeObjectURL(pdfPreviewUrl);
                }}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Cancel
              </button>
            </div>

            {/* PDF Preview */}
            <div className="flex-1 bg-gray-200">
              <iframe
                src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                title="PDF Preview"
                className="w-full h-full border-0"
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={handleFinalDownload}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;