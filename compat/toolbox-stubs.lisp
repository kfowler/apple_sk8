;;;; toolbox-stubs.lisp
;;;; Mac Toolbox compatibility stubs for SK8
;;;; These are non-functional stubs that allow code to load

(in-package :ccl)

;;; Toolbox trap interface
;;; In MCL, #_ is a reader macro for toolbox traps
;;; We provide stub functions instead

(defmacro require-trap (trap-name &rest args)
  "Stub for Mac Toolbox traps"
  (declare (ignore trap-name args))
  nil)

;;; Define common trap stubs as macros that expand to nothing or safe values
;;; These are used in SK8 source code with the #_ prefix

(eval-when (:compile-toplevel :load-toplevel :execute)
  ;; Define a simple dispatch table for toolbox traps
  ;; This allows code using #_TrapName to work (if we add the reader macro)

  (defun define-trap-stub (name &optional (return-value nil))
    "Define a stub for a toolbox trap"
    (setf (get name 'trap-stub) return-value))

  ;; Define common traps used in SK8
  (define-trap-stub 'moremasters nil)
  (define-trap-stub 'updateresfile nil)
  (define-trap-stub 'getresinfo nil)
  (define-trap-stub 'newhandle nil)
  (define-trap-stub 'disposhandle nil)
  (define-trap-stub 'releaseresource nil)
  (define-trap-stub 'curresfile 0)
  (define-trap-stub 'useresfile nil)
)

;;; Resource file functions

(defmacro with-open-res-file ((var path &key errorp if-does-not-exist) &body body)
  "Stub for with-open-res-file"
  (declare (ignore var path errorp if-does-not-exist))
  `(progn ,@body))

(defmacro with-open-resource-file ((var path &rest options) &body body)
  "Stub for with-open-resource-file"
  (declare (ignore var path options))
  `(progn ,@body))

(defun get-resource (type id &optional must-exist-p)
  "Stub for get-resource"
  (declare (ignore type id must-exist-p))
  nil)

(defun delete-resource (type id &optional must-exist-p)
  "Stub for delete-resource"
  (declare (ignore type id must-exist-p))
  nil)

(defun add-resource (handle type id &key name)
  "Stub for add-resource"
  (declare (ignore handle type id name))
  nil)

(defun write-resource (handle)
  "Stub for write-resource"
  (declare (ignore handle))
  nil)

(defun detach-resource (handle)
  "Stub for detach-resource"
  (declare (ignore handle))
  nil)

(defun current-resource-file ()
  "Stub for current-resource-file"
  0)

(defmacro using-resource-file (refnum &body body)
  "Stub for using-resource-file"
  (declare (ignore refnum))
  `(progn ,@body))

(defun update-resource-file (refnum)
  "Stub for update-resource-file"
  (declare (ignore refnum))
  nil)

;;; Stack-based memory allocation

(defmacro %stack-block (bindings &body body)
  "Stub for %stack-block - allocates temporary memory"
  (declare (ignore bindings))
  `(progn ,@body))

;;; Notification

(defun y-or-n-dialog (prompt &key yes-text no-text)
  "Stub for y-or-n-dialog - always returns T"
  (format t "~&Dialog: ~A [~A/~A]~%" prompt yes-text no-text)
  (format t "~&  (Automatically answering YES in non-interactive mode)~%")
  t)

(defun get-string-from-user (prompt &key initial-string allow-empty-strings)
  "Stub for get-string-from-user"
  (declare (ignore allow-empty-strings))
  (format t "~&Prompt: ~A~%" prompt)
  (format t "~&  (Returning default: ~S)~%" initial-string)
  (or initial-string ""))

;;; Dribble - just use the CL:DRIBBLE function
;;; No need to redefine it, CL already has one
;;; (MCL's dribble is essentially the same as CL's)

;;; Application saving

(defun save-application (path &key creator init-file size resources)
  "Stub for save-application"
  (format t "~&; Note: save-application called with:~%")
  (format t "~&;   Path: ~A~%" path)
  (format t "~&;   Creator: ~A~%" creator)
  (format t "~&;   Init file: ~A~%" init-file)
  (format t "~&;   Size: ~A~%" size)
  (format t "~&;   Resources: ~A~%" resources)
  (format t "~&; (Application saving not supported in compatibility mode)~%")
  nil)

(format t "~&; Mac Toolbox stubs loaded~%")
