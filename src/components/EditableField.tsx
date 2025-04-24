import React from "react";
import { Field, ErrorMessage } from "formik";

const EditableField = ({ name, label, type }: { name: string; label: string; type: string }) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <Field
      name={name}
      type={type}
      className={`w-full p-2 border border-gray-300 rounded ${
        type === "checkbox" ? "inline-block" : ""
      }`}
    />
    <ErrorMessage name={name} component="div" className="text-red-500 text-sm mt-1" />
  </div>
);

export default EditableField;
