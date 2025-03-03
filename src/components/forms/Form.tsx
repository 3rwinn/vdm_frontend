import { ReactNode } from "react";
import { Formik, FormikValues } from "formik";

interface FormProps {
  initialValues: FormikValues;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (func: any) => void;
  validationSchema?: unknown;
  children: ReactNode;
  enableReinitialize?: boolean;
}

function Form({
  initialValues,
  onSubmit,
  validationSchema,
  children,
}: FormProps) {
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={validationSchema}
    >
      {() => children}
    </Formik>
  );
}

export default Form;
