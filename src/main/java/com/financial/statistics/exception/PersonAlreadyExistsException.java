package com.financial.statistics.exception;

public class PersonAlreadyExistsException extends RuntimeException {
    private String message;

    public PersonAlreadyExistsException() {
    }

    public PersonAlreadyExistsException(String message) {
        super(message);
        this.message = message;
    }
}
